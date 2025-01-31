export enum ActionTypes {
  GET_HOMEFEED = 'GET_HOMEFEED',
}

export type Dispatch = (action: Action | { type: string; payload?: any }) => void;

interface AsyncActionCreators {
  REQUEST: string;
  SUCCESS: string;
  FAILURE: string;
  request: ActionCreator;
  success: ActionCreator;
  failure: ErrorActionCreator;
}

export interface Action<T = any> {
  type: string;
  payload?: T;
  meta?: any;
}

interface ErrorAction<T = any> extends Action<T> {
  error: true;
}

type ActionCreator = <Payload = unknown, Meta = unknown>(
  payload?: Payload,
  meta?: Meta
) => Action<Payload>;

type ErrorActionCreator = <Payload = unknown, Meta = unknown>(
  payload?: Payload,
  meta?: Meta
) => ErrorAction<Payload>;

export function asyncAction(actionName: ActionTypes): AsyncActionCreators {
  const actionTypes = {
    REQUEST: `${actionName}_REQUEST`,
    SUCCESS: `${actionName}_SUCCESS`,
    FAILURE: `${actionName}_FAILURE`,
  } as const;

  return {
    ...actionTypes,
    request: createAction(actionTypes.REQUEST),
    success: createAction(actionTypes.SUCCESS),
    failure: createErrorAction(actionTypes.FAILURE),
  };
}

function createAction(type: string): ActionCreator {
  return (payload, meta) => ({ type, payload, meta });
}

function createErrorAction(type: string): ErrorActionCreator {
  return (payload, meta) => ({ type, error: true, payload, meta });
}

// export interface PubSubAction {
//   name: string;
//   uuid: string;
//   id: string;
//   errorMessage?: string;
// }

export function errorHandlerFactory(
  dispatch: (action: Action | ErrorAction) => void,
  action: AsyncActionCreators,
) {
  return (error: Error) => {
    dispatch(action.failure(error));
    console.error('Error:', error, '\nAction:', action);
  };
}