import { Component } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

@IonicPage()
@Component({
  selector: 'page-door',
  templateUrl: 'door.html'
})
export class DoorPage {

    name: string;
    birthday: string;

  constructor(public navCtrl: NavController, public navParams: NavParams) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad Door');
  }

  notCompleted(): boolean {
      return (!this.name || !this.birthday);
  }

  submit(): void {

  }

}
