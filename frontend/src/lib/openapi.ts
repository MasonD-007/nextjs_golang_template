export interface Item {
    id: number;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
}

export interface CreateItemRequest {
    name: string;
    description: string;
}

export interface UpdateItemRequest {
    name: string;
    description: string;
}

export interface Error {
    message: string;
}

export type paths = {
    '/items': {
        get: {
            parameters?: {
                query?: {
                    id?: number;
                };
            };
            responses: {
                200: {
                    schema: Item[];
                };
                400: {
                    schema: Error;
                };
                404: {
                    schema: Error;
                };
            };
        };
        post: {
            requestBody: {
                content: {
                    'application/json': CreateItemRequest;
                };
            };
            responses: {
                201: {
                    schema: Item;
                };
                400: {
                    schema: Error;
                };
            };
        };
        delete: {
            parameters?: {
                query?: {
                    id?: number;
                };
            };
            responses: {
                204: never;
                400: {
                    schema: Error;
                };
            };
        };
        put: {
            parameters?: {
                query?: {
                    id?: number;
                };
            };
            requestBody: {
                content: {
                    'application/json': UpdateItemRequest;
                };
            };
            responses: {
                200: {
                    schema: Item;
                };
                400: {
                    schema: Error;
                };
            };
        };
    };
}
