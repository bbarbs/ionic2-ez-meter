import { Component } from '@angular/core';
import { NavController, ViewController, NavParams } from 'ionic-angular';
import {BluetoothSerial, Toast} from 'ionic-native';

/*
  Generated class for the DeviceListPage page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  templateUrl: 'build/pages/device-list/device-list.html',
})
export class DeviceListPage {
  devices: Array<string>;
  connect;

  constructor(private nav: NavController, private view: ViewController, private params: NavParams) {
    this.devices = [];
    this.devices = this.devices.concat(params.get('list'));
    console.log(params.get('list'));
    console.log(this.devices);
  }

  onConnect(item) {
    Toast.show("Connecting.....", "short", "bottom").subscribe();
    let pairedDevice = {
      id: item.id
    };
    this.view.dismiss(pairedDevice);
  }
  cancel() {
    let pairedDevice = {
      id: null
    };
    this.view.dismiss(pairedDevice);
  }
}
