import {CameraService} from "../camera.service";
import express from "express";
import expressWs from "express-ws";
import * as https from "https";
import {Server} from "https";

jest.mock('https');
jest.mock('rtsp-relay', () => jest.fn().mockImplementation(() => {
    return {
        proxy: jest.fn()
    }
}));

jest.mocked(Server).mockImplementation(() => {
    return {} as Server;
})

let cameraService: CameraService;

const app = expressWs(express()).app;
const server = new Server();


describe("getInstance", () => {
    test("expect error", () => {
        try {
            CameraService.getInstance();
        } catch (e) {
            expect(e).toBeDefined();
        }
    });
    test("expect success", () => {
        cameraService = CameraService.getInstance("h", "h", app, server);
        expect(cameraService).toBeDefined();
    });
});
describe("HQ_PATH", () => {
    test("what should go wrong?", () => {
        expect(CameraService.HQ_PATH).toEqual('/api/stream1');
    });
});
describe("LQ_PATH", () => {
    test("what should go wrong2?", () => {
        expect(CameraService.LQ_PATH).toEqual('/api/stream2');
    });
});