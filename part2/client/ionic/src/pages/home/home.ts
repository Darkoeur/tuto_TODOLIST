import { Component, OnInit } from '@angular/core';
import { NavController, AlertController, Platform } from 'ionic-angular';
import { ZetaPushConnection } from 'zetapush-angular';
import { NotesManager } from '../../providers/notes-manager';
import { Note } from '../../api/notes-api.service';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: [NotesManager]
})
export class HomePage implements OnInit {

    notes: Array<Note>;
    selection: Array<Note>;

    constructor(
        public navCtrl: NavController,
        public alertCtrl: AlertController,
        private platform: Platform,
        private zpConnection: ZetaPushConnection,
        private notesManager: NotesManager) {

            this.selection = [];

            this.notesManager.notes.subscribe(
                notes => {
                    console.log('Well received captain ! ', notes);
                    this.notes = notes;
                },
                error => { console.log(error) }
            );

        }

        ngOnInit(): void {
            this.platform.ready().then(() => {
                this.zpConnection.connect().then(() => {
                    // getting notes from server after connection
                    this.notesManager.getNotes();
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
                            this.notesManager.pushNote(data.text);
                        }
                    }
                ]
            });
            form.present();
        }

        userClear() {
            this.notesManager.resetNotes();
            this.notes = [];
        }

        userRefresh() {
            this.notesManager.getNotes();
        }

        userDelete(deleted : Note) {
            var ids = [];
            ids.push(deleted.id);
            this.notesManager.deleteNotes(ids);
        }

        userSelect(note: Note){
            this.selection.push(note);
        }

}
