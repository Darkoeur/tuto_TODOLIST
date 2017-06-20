// fichier src/api/users-api.service.ts
import { NgZone } from '@angular/core';
import { Api, ZetaPushClient, createApi } from 'zetapush-angular';

export class UsersApi extends Api {

	// Names MUST match the macros on server

	create({login, password}:  { login: string, password: string}): Promise<any> {
		return this.$publish('create', {login, password});
	}

}

export function UsersApiFactory(client: ZetaPushClient, zone: NgZone): UsersApi {
    return createApi(client, zone, UsersApi) as UsersApi;
}

export const UsersApiProvider = {
	provide: UsersApi, useFactory: UsersApiFactory, deps: [ ZetaPushClient, NgZone ]
}
