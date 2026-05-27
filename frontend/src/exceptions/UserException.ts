import { CustomException } from "./CustomException";


export class UserException extends CustomException {}

/**
 * Isso é utilizado quando o contrato retorna um erro.
 */
export class ErrorGetUser extends CustomException {}
