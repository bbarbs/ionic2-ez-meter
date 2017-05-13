import {Component, NgZone} from '@angular/core';
import {Modal, NavController, NavParams} from 'ionic-angular';
import {BluetoothSerial, Toast} from 'ionic-native';
import {DeviceListPage} from '../device-list/device-list';

@Component({
  templateUrl: 'build/pages/home/home.html'
})
export class HomePage {
  connectionState: string = "Connect";
  connectionName: string = "None";
  rwMessage: string;
  pairedDevices: Array<string>;
  dataTransmit: string;
  macAddress: string;
  disableWriteRequestBtn: boolean = true;
  disableClearBtn: boolean = true;
  connect;
  subscribe;
  connectSub;
  subscribeSub;

  constructor(private navCtrl: NavController, private params: NavParams, private zone: NgZone) {
    this.initializeBT();
  }

  initializeBT() {
    BluetoothSerial.isEnabled()
      .then(res => {
        console.log('Bluetooth enabled');
        this.getDeviceList();
      }, err => {
        console.error('Bluetooth disabled');
        this.enableBT();
      });
  }

  enableBT() {
    BluetoothSerial.enable()
      .then(res => {
        this.getDeviceList();
      });
  }

  getDeviceList() {
    this.pairedDevices = [];
    BluetoothSerial.list()
      .then(res => {
        this.pairedDevices = this.pairedDevices.concat(res);
        console.log(this.pairedDevices);
      }, err => {
        console.error(err);
      });
  }

  onWriteOrRequest(message) {
    this.dataTransmit = message;
    if (message.indexOf('AT+W_REG') != -1) {
      Toast.show("Writing.....", "short", "bottom").subscribe();
    } else {
      Toast.show("Requesting.....", "short", "bottom").subscribe();
    }
    BluetoothSerial.write(message + '\r\n')
      .then(res => {
        Toast.show("Done", "short", "bottom").subscribe();
        this.zone.run(() => {
          this.rwMessage = "";
        });
      },
      err => {
        console.error(err);
      });
  }

  mannageConnection() {
    BluetoothSerial.isConnected()
      .then(res => {
        this.disconnectOnDevice();
      },
      err => {
        this.openModalConnection();
      });
  }

  onConnect(id) {
    Toast.show("Connected", "short", "bottom").subscribe();
    this.connect = BluetoothSerial.connect(id);
    this.connectSub = this.connect.subscribe(res => {
      this.zone.run(() => {
        this.disableWriteRequestBtn = false;
      });
      this.onSubscribe();
    }, err => {
      console.error(err);
    });
  }

  disconnectOnDevice() {
    Toast.show("Disconnecting.....", "short", "bottom").subscribe();
    this.connectSub.unsubscribe();
    this.subscribeSub.unsubscribe();
    setTimeout(() => {
      Toast.show("Disconnected", "short", "bottom").subscribe();
      this.zone.run(() => {
        this.disableWriteRequestBtn = true;
        this.connectionState = "Connect";
        this.connectionName = "None";
      });
    }, 500);
  }

  onSubscribe() {
    this.subscribe = BluetoothSerial.subscribe('\n');
    this.subscribeSub = this.subscribe.subscribe(res => {
      console.log("Subscribe: " + res);
      this.displayMessage(res);
    });
  }

  displayMessage(message) {
    let display = document.getElementById("deviceMessage");
    let lineBreak1 = document.createElement("br");
    let lineBreak2 = document.createElement("br");
    let div = document.createElement("div");
    let breakDiv = document.createElement("div");
    breakDiv.style.border = "dashed #ccc";
    breakDiv.style.borderTop = "none";
    breakDiv.style.marginTop = "10px";
    breakDiv.style.marginBottom = "10px";

    let transmit = "TD: " + this.dataTransmit;
    let receive = "RD: " + message;

    let hourMeterName: string;
    let hourMeterVal: string = this.dataTransmit.substr(12, 4);
    if (hourMeterVal == "0105") {
      hourMeterName = "HM1:";
    } else if (hourMeterVal == "0106") {
      hourMeterName = "HM2:";
    } else if (hourMeterVal == "0107") {
      hourMeterName = "HM3:";
    } else {
      hourMeterName = "VAL:";
    }

    let val = message.substr(17, 8);
    let result = hourMeterName + " " + parseInt(val, 16);

    let td = document.createTextNode(transmit);
    let rd = document.createTextNode(receive);
    let vl = document.createTextNode(result);

    div.appendChild(td);
    div.appendChild(lineBreak1);
    div.appendChild(rd);
    div.appendChild(lineBreak2);
    div.appendChild(vl);

    display.appendChild(div);
    display.appendChild(breakDiv);

    this.zone.run(() => {
      this.disableClearBtn = false;
    });
  }

  clearDisplatMsg() {
    let display = document.getElementById("deviceMessage");
    display.innerHTML = "";

    this.zone.run(() => {
      this.disableClearBtn = true;
    });
  }

  openModalConnection() {
    let deviceListModal = Modal.create(DeviceListPage, { list: this.pairedDevices });
    deviceListModal.onDismiss(data => {
      this.zone.run(() => {
        if (data.id == null) {
          this.connectionState = "Connect";
          this.connectionName = "None";
        } else {
          this.connectionName = data.id;
          this.macAddress = data.id;
          this.connectionState = "Disconnect";
          this.onConnect(data.id);
        }
      });
    });
    this.navCtrl.present(deviceListModal);
  }
}
