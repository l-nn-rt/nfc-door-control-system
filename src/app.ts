import {SqlFactory} from './database/sqlFactory';
import {LdapFactory} from './database/ldapFactory';
import express, {Router} from 'express';
import sessions from 'express-session';
import cookieParser from 'cookie-parser';
import path from 'path';
import * as fs from 'fs';
import expressWs, {WithWebsocketMethod} from 'express-ws';
import * as https from 'https';

import {HostName} from 'shared-utilities';

import {LoggerMidware} from './midware/logger.midware';
import {DatabaseFactory} from './database/databaseFactory';
import {Config} from './model/config.model';
import {DatabaseConfig} from './model/databaseConfig';
import {CameraService} from './services/camera.service';
import {CameraRouter} from './router/camera.router';
import {DoorRouter} from './router/door.router';
import {EventRouter} from './router/event.router';
import {UserRouter} from './router/user.router';
import {NotificationRouter} from './router/notification.router';
import {EventController} from './controller/event.controller';
import {CameraController} from './controller/camera.controller';
import {DoorController} from './controller/door.controller';
import {UserController} from './controller/user.controller';
import {NotificationController} from './controller/notification.controller';

declare module 'express-session' {
    export interface SessionData {
        validUntil: number;
        username: string;
    }
}

/**
 * App is the main app that needs to be started if you to run the server.
 * The App starts the {@link express.Application} and initializes the {@link Router}.
 *
 * @author Lennart Rak
 * @author Gregor Peters
 * @version 1.0
 */
export class App {
    private static readonly application: express.Application & WithWebsocketMethod = expressWs(
        express()
    ).app;
    private static readonly server: https.Server = https.createServer(
        {
            key: fs.readFileSync(path.join(__dirname, '../config/server.key')),
            cert: fs.readFileSync(path.join(__dirname, '../config/server.cert'))
        },
        this.application
    );
    private static databaseFactory: DatabaseFactory;
    private static databaseConfig: DatabaseConfig;
    private static config: Config = require('../config/default.json');

    public static main(): void {
        /*------------Database Configuration----------*/
        switch (this.config.database) {
            case 'sql':
                this.databaseConfig = require('../config/database/sql.json');
                App.databaseFactory = new SqlFactory(this.databaseConfig);
                break;
            case 'ldap':
                this.databaseConfig = require('../config/database/ldap.json');
                App.databaseFactory = new LdapFactory(this.databaseConfig);
                break;
            default:
                this.databaseConfig = require('../config/database/ldap.json');
                App.databaseFactory = new LdapFactory(this.databaseConfig);
        }
        //Pass config to service once so controller can get instances without passing the config everytime
        App.databaseFactory.createService(this.databaseConfig);

        /*--------Server Configuration-----------*/
        const port: number = this.config.port;
        const hostname: HostName = this.config.hostname;
        CameraService.getInstance(
            this.config.rtspUrlH,
            this.config.rtspUrlL,
            this.application,
            this.server
        );

        const whitelist = this.config.whitelist;
        whitelist.push(this.config.doorMicrocontroller.endpoint.value.toString());

        this.application.use(function (req, res, next) {
            const origin: string | undefined = req.headers.origin;
            if (origin && whitelist.includes(origin)) {
                res.setHeader('Access-Control-Allow-Origin', origin);
            }
            res.header('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
            res.header(
                'Access-Control-Allow-Headers',
                'Origin, X-Requested-With, Content-Type, Accept, Authorization'
            );
            next();
        });
        this.application.use(
            sessions({
                secret: 'this needs to be randomly generated',
                saveUninitialized: true,
                cookie: {maxAge: this.config.sessionMaxAge},
                resave: false
            })
        );
        this.application.use(express.json());
        this.application.use(express.urlencoded({extended: true}));
        this.application.use(cookieParser());
        this.application.use(LoggerMidware.log);

        /*---------Controller----------*/
        const cameraController = new CameraController(this.config.port);
        const doorController = new DoorController(
            this.config.doorMicrocontroller,
            this.databaseFactory
        );
        const userController = new UserController(
            doorController,
            this.config.sessionMaxAge,
            this.databaseFactory
        );
        const notificationController = new NotificationController();
        const eventController = new EventController(notificationController, this.databaseFactory);

        /*---------------Router---------------*/
        const router: Router = Router();

        const cameraRouter = new CameraRouter(cameraController);
        const doorRouter = new DoorRouter(doorController, this.databaseFactory);
        const eventRouter = new EventRouter(eventController, this.databaseFactory);
        const userRouter = new UserRouter(userController, this.databaseFactory);
        const notificationRouter = new NotificationRouter(notificationController);

        router.use(notificationRouter.router);
        router.use(this.config.userPath, userRouter.router);
        router.use(this.config.doorPath, doorRouter.router);
        router.use(this.config.eventPath, eventRouter.router);
        router.use(this.config.cameraPath, cameraRouter.router);

        this.application.use(this.config.basePath, router);
        process.setMaxListeners(0);

        /*--------------Start Server---------*/
        this.server.listen(port, () => {
            console.log(`Server started at https://${hostname.toString()}:${port}`);
        });
    }
}

App.main();
