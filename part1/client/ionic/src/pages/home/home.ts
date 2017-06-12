import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { ZetaPushConnection } from 'zetapush-angular';
import { Note, NotesApi } from '../../api/notes-api.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage implements OnInit {

    // where we will store our notes
    notes : Array<Note> = [];

    constructor(
        public navCtrl: NavController,
        public alertCtrl: AlertController,
        private platform: Platform,
        private zpConnection: ZetaPushConnection,
        private api: NotesApi) {

            // we set listeners to handle server response
            api.onGetNotes.subscribe((response) => {
                this.notes = [];
                response['notes'].forEach(note => {
                    this.notes.push(note);
                });
            });

            api.onPushNote.subscribe((response) => {
                this.notes.unshift(response['note']);
            });

            api.onDeleteNotes.subscribe((response) => {
                // a refresh certifies us to be sync with the server
                this.api.getNotes({});
            });

        }

        ngOnInit(): void {
            this.platform.ready().then(() => {
                this.zpConnection.connect().then(() => {
                    // getting notes from server after connection
                    this.api.getNotes({});
                });
            });
        }

        // functions user will trigger with buttons
        userAddNote() {
            let form = this.alertCtrl.create({
                title : 'Add a note',
                message : 'Enter the text of the note here',
                inputs: [
                    {
                        name: 'text',
                        placeholder: ''
                    }
                ],
                buttons: [
                    {
                        text: 'Cancel',
                        handler: data => {
                            // nothing
                        }
                    },
                    {
                        text: 'Add',
                        handler: data => {
                            this.api.pushNote({content:data.text});
                        }
                    }
                ]
            });
            form.present();
        }

        userClear() {
            this.api.reset({});
            this.notes = [];
        }

        userRefresh() {
            this.api.getNotes({});
        }

        userDelete(deleted : Note) {
            var ids = [];
            ids.push(deleted.id);
            this.api.deleteNotes({ids});
        }

}
