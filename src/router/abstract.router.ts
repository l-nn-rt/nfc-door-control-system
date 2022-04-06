import express from "express";

export abstract class AbstractRouter {
    public abstract get router(): express.Router;
}