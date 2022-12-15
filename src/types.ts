import { observable } from "@trpc/server/observable";
import type {
  TRPCClientOutgoingMessage,
  TRPCErrorResponse,
  TRPCRequest,
  TRPCResultMessage,
} from "@trpc/server/rpc";

export type TRPCFigmaRequest = {
  trpc: TRPCRequest | TRPCClientOutgoingMessage;
};

export type TRPCFigmaSuccessResponse = {
  trpc: TRPCResultMessage<any>;
};

export type TRPCFigmaErrorResponse = {
  trpc: TRPCErrorResponse;
};

export type TRPCFigmaResponse =
  | TRPCFigmaSuccessResponse
  | TRPCFigmaErrorResponse;
