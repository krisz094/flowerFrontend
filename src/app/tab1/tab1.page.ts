import { Component, OnInit } from '@angular/core';
import iro from '@jaames/iro';
import { GoogleChartInterface } from 'ng2-google-charts';
@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page implements OnInit {
  cards = [];
  humiCard;
  tempCard;
  waterCard;
  lightingCard;
  ws: WebSocket;
  wsState = 0;
  startTime = '12:34';
  endTime = '13:45';
  iroPicker = null;
  iroColor = 'rgb(255,0,0)';
  public tempChart: GoogleChartInterface;
  public humiChart: GoogleChartInterface;
  public waterChart: GoogleChartInterface;
  public lightChart: GoogleChartInterface;
  public charts = {};

  loadTempChart(data) {
    console.log('loading temperature chart');
    this.tempChart = {
      chartType: 'LineChart',
      dataTable: [
        ['Date', 'Temperature']
      ].concat(data),
      options: {
        curveType: 'function',
        title: 'Temperature',
        height: 300,
        width: '25%',
        chartArea: { height: '200' },
        hAxis: {
          title: 'Date',
          minValue: new Date(+new Date() - 1000 * 60 * 60 * 2)
        },
        vAxis: {
          title: 'Temperature',
          minValue: 20,
          maxValue: 34
        }
      },
    };
    this.charts['temp'] = this.tempChart;
    setTimeout(() => {
      console.log(this.tempChart);
      /* this.tempChart.component.draw(); */
    }, 1000);
  }

  loadHumiChart(data) {
    console.log('loading humidity chart');
    this.humiChart = {
      chartType: 'LineChart',
      dataTable: [
        ['Date', 'Humidity']
      ].concat(data),
      options: {
        curveType: 'function',
        title: 'Humidity',
        height: 300,
        width: '25%',
        chartArea: { height: '200' },
        hAxis: {
          title: 'Date',
          minValue: new Date(+new Date() - 1000 * 60 * 60 * 2)
        },
        vAxis: {
          title: 'Humidity',
          minValue: 30,
          maxValue: 60
        }
      },
    };
    this.charts['humi'] = this.humiChart;
    setTimeout(() => {
      /* this.humiChart.component.draw(); */
    }, 1000);
  }

  loadWaterChart(data) {
    console.log('loading water chart');
    this.waterChart = {
      chartType: 'LineChart',
      dataTable: [
        ['Date', 'Water OK']
      ].concat(data),
      options: {
        /* curveType: 'function', */
        title: 'Water OK',
        height: 300,
        width: '25%',
        chartArea: { height: '200' },
        hAxis: {
          title: 'Date',
          minValue: new Date(+new Date() - 1000 * 60 * 60 * 2)
        },
        vAxis: {
          title: 'Water OK',
          minValue: 0,
          maxValue: 1
        }
      },
    };

    this.charts['water'] = this.waterChart;
    setTimeout(() => {
      /* this.waterChart.component.draw(); */
    }, 1000);
  }

  /* loadLightChart(data) {
    console.log('loading lighting chart');
    this.lightChart = {
      chartType: 'LineChart',
      dataTable: [
        ['LED Activity', 'Temperature']
      ].concat(data),
      options: {
        curveType: 'function',
        title: 'Temperature',
        height: 300,
        width: '25%',
        chartArea: { height: '200' },
        hAxis: {
          title: 'Date',
          minValue: new Date(+new Date() - 1000 * 60 * 60 * 2)
        },
        vAxis: {
          title: 'LED Activity',
          minValue: 0,
          maxValue: 1
        }
      },
    };
    this.charts['light'] = this.lightChart;
  } */



  retryWSConnect() {
    this.wsState = -1;
    setTimeout(() => {
      if (this.ws && this.ws.readyState === 3) {
        this.connectWS();
      }
    }, 1000);
  }

  padZero(num) {
    if (num < 10) {
      return '0' + num;
    }
    return num;
  }

  connectWS() {
    this.wsState = 0;
    this.ws = new WebSocket('ws://192.168.0.130/ws');
    // Connection opened
    this.ws.addEventListener('open', event => {
      /* ws.send('Hello Server!'); */
      this.wsState = 1;
    });

    // Listen for messages
    this.ws.addEventListener('message', event => {
      console.log('Message from server ', event.data);
      const data = JSON.parse(event.data);
      if (data.type === 'flowerStatus') {
        this.humiCard.content = data.cHumidity + '%';
        this.tempCard.content = data.cTemperature + '°C';
        this.waterCard.content = data.cSoilWet ? 'Yes' : 'No';
        if (data.isNightTime) {
          this.lightingCard.content = 'Night Time';
        } else if (data.cSunShining) {
          this.lightingCard.content = 'Sun is shining';
        } else {
          this.lightingCard.content = 'LED Active';
        }
      } else if (data.type === 'initialData') {
        this.startTime =
          this.padZero(data.nightTime.from.h) +
          ':' +
          this.padZero(data.nightTime.from.m);
        this.endTime =
          this.padZero(data.nightTime.to.h) +
          ':' +
          this.padZero(data.nightTime.to.m);

        const str = `rgb(${Math.round(
          data.properColor.r * 255 * 3
        )}, ${Math.round(data.properColor.g * 255 * 3)}, ${Math.round(
          data.properColor.b * 255 * 3
        )})`;
        console.log(str);
        if (this.iroPicker) {
          this.iroPicker.color.set(str);
          console.log('fefe');
        } else {
          this.iroColor = str;
          console.log('treme');
        }

        if (data.serverFlowerStates) {
          this.loadTempChart(data.serverFlowerStates.map(data => [new Date(data.date), data.temperature]));
          this.loadHumiChart(data.serverFlowerStates.map(data => [new Date(data.date), data.humidity]));
          this.loadWaterChart(data.serverFlowerStates.map(data => [new Date(data.date), data.soilWet ? 1 : 0]));
        }

        console.log(this.tempChart)
      } else if (data.type === 'newFlowerState') {
        const pl = data.payload;

      }
    });

    this.ws.onerror = () => this.retryWSConnect();
    this.ws.onclose = () => this.retryWSConnect();
  }
  constructor() {
    this.humiCard = {
      title: 'Humidity',
      content: '25%',
      tableKey: 'humi',
      /* chart: this.humiChart, */
      img:
        'https://base.imgix.net/files/base/ebm/hpac/image/2019/06/hpac' +
        '_7132_hpac_humidity_control_0719_pr.png?auto=format&fit=crop&h=432&w=768'
    };
    this.tempCard = {
      title: 'Temperature',
      content: '23°',
      tableKey: 'temp',
      /* chart: this.tempChart, */
      img: 'https://shop.movar-print.hu/wp-content/uploads/2019/03/tavaszimezo-vaszonkep.jpg'
    };
    this.waterCard = {
      title: 'Is watered',
      content: 'No',
      tableKey: 'water',
      /* chart: this.waterChart, */
      img:
        'https://www.water-technology.net/wp-content/uploads/sites/28/2017/11/water-thumb.png'
    };
    this.lightingCard = {
      title: 'Lighting',
      content: 'LED Strip On',
      /* tableKey: 'light', */
      /* chart: this.lightChart, */
      img:
        'https://www.thegreenage.co.uk/wp-content/uploads/2016/11/Screen-Shot-2016-10-24-at-12.17.46-780x350.png'
    };

    this.connectWS();

    this.cards = [
      this.tempCard,
      this.humiCard,
      this.waterCard,
      this.lightingCard
    ];
  }

  nightTimeChanged(event, whichElem) {
    if (whichElem === 'start') {
      this.startTime = event.detail.value;
    } else {
      this.endTime = event.detail.value;
    }

    console.log(event, this.startTime, this.endTime);

    const fromSplitted = this.startTime.split(':');
    const toSplitted = this.endTime.split(':');

    if (this.ws) {
      this.ws.send(
        JSON.stringify({
          nightTime: {
            from: { h: fromSplitted[0], m: fromSplitted[1] },
            to: { h: toSplitted[0], m: toSplitted[1] }
          }
        })
      );
    }
  }

  ngOnInit() {
    this.iroPicker = new iro.ColorPicker('#sliderpick', {
      width: 250,
      color: '' + this.iroColor,
      borderWidth: 1,
      borderColor: '#fff',
      layout: [
        {
          component: iro.ui.Slider,
          options: {
            sliderType: 'hue'
          }
        }
      ]
    });

    this.iroPicker.on('color:change', clr => {
      /* console.log(clr); */
      // log the current color as a HEX string
      if (this.ws) {
        const properColor = clr.rgb;
        properColor.r /= 255 * 3;
        properColor.g /= 255 * 3;
        properColor.b /= 255 * 3;
        this.ws.send(
          JSON.stringify({
            properColor
          })
        );
      }
    });

    this.loadTempChart([]);
    this.loadHumiChart([]);
    this.loadWaterChart([]);
    /* this.loadLightChart([]); */
    /* this.loadTempChart(); */

  }
}
