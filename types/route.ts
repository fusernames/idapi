const { Request, Response } = require('express')

export interface Route {
  path: string;
  method: string;
  access: string | Promise<boolean>;
  before?: (ctx: Ctx) => Promise<void>;
  resolver?: (ctx: Ctx) => Promise<any>;
  after?: (ctx: Ctx, result: any) => Promise<void>;
  queryMiddleware: (query: any, ctx: Ctx) => Promise<void>
  disableRespond?: Boolean
}

export interface Routes {
  [index: string]: Route
}

export interface Ctx {
  Model: object
  req: Request,
  res: Response,
}

export interface RouteCtx {
  lowercaseName?: string | null
  pluralName?: string | null
  authorizations: Authorizations
  route: Route
  modelName: string | null | undefined
  Model: any
}

export interface Authorizations {
  [index: string]: Promise<boolean>
}