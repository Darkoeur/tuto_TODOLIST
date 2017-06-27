import { NgZone } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Api, ZetaPushClient, createApi } from 'zetapush-angular';

// The note representation
export interface Note {
    id: string,
    text: string,
    author: string,
    authorKey: string,
    date: number
}

// A feature will implement auto-generation
// of the code below in the future
export class NotesApi extends Api {

	// Observables to catch the server response
	// They act as listeners
	onPushNote: Observable<any>;
	onGetNotes: Observable<any>;
	onDeleteNotes: Observable<any>;

	// Names MUST match the macros on server

	pushNote({content}){
		return this.$publish('pushNote', {content});
	}

	getNotes({}){
		return this.$publish('getNotes', {});
	}

	deleteNotes({ids} : { ids : Array<string> }){
		return this.$publish('deleteNotes', {ids});
	}

	reset({}){
		return this.$publish('reset', {});
	}

}

export function NotesApiFactory(client: ZetaPushClient, zone: NgZone): NotesApi {
    return createApi(client, zone, NotesApi) as NotesApi;
}

export const NotesApiProvider = {
	provide: NotesApi, useFactory: NotesApiFactory, deps: [ ZetaPushClient, NgZone ]
}
