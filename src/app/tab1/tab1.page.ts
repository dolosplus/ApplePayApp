import { Component } from '@angular/core';
import { ApplePay } from '@ionic-native/apple-pay/ngx';
import { AlertController } from '@ionic/angular';
import { NgxSoapService, Client, ISoapMethodResponse } from 'ngx-soap';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss']
})
export class Tab1Page {

  client: Client;
  intA = 2;
  intB = 3;

  items: any = [
    {
      label: 'April 2020 - Soccer Season',
      amount: 25.00
    },
    {
      label: 'CA Tax',
      amount: 2.50
    },
    {
      label: 'TOTAL: Fantasy Soccer League',
      amount: 27.50
    }
  ];

  shippingMethods: any = [
    {
      identifier: 'NextDay',
      label: 'NextDay',
      detail: 'Arrives tomorrow by 5pm.',
      amount: 3.99
    },
    {
      identifier: 'Standard',
      label: 'Standard',
      detail: 'Arrive by Friday.',
      amount: 4.99
    },
    {
      identifier: 'SaturdayDelivery',
      label: 'Saturday',
      detail: 'Arrive by 5pm this Saturday.',
      amount: 6.99
    }
  ];

  supportedNetworks: any = ['visa', 'amex', 'master'];
  merchantCapabilities: any = ['3ds', 'debit', 'credit'];
  merchantIdentifier: string = 'merchant.com.testme.pay';
  currencyCode: string = 'USD';
  countryCode: string = 'US';
  billingAddressRequirement: any = ['Jak Ratiwanich', 'jak@dolosplus.com', '9493462989'];
  shippingAddressRequirement: any = 'none';
  shippingType: string = "shipping";
  message:any;

  constructor(
    private soap: NgxSoapService,
    private applePay: ApplePay,
    public alertController: AlertController) {

      this.soap.createClient('assets/payment.wsdl')
          .then(c=> {
            console.debug("createClient",c);
            this.client =c;
          })
          .catch(e=>console.error("ERROR: soap.createClient()",e));
        //.subscribe(client => this.client = client);

  }

  buildXML(){
    // const body = {
    //   intA: this.intA,
    //   intB: this.intB
    // };

    const body = {

        credentials: {
          AccountID:"xxx",
          AccountToken: "xxx",
          AcceptorID: "xxx"
        },
        application: {
          ApplicationID: 10160,
          ApplicationVersion: "1.0",
          ApplicationName:"Express.CSharp"
        }
      
    };
    this.client.clearHttpHeaders();
    this.client.addHttpHeader('Access-Control-Allow-Origin', "*");
    this.client.addHttpHeader('Content-type', "text/xml");
    this.client.addHttpHeader('Accept', "*/*");
    this.client.addHttpHeader('Host', "certtransaction.elementexpress.com");
    //let header = {Host: "certtransaction.elementexpress.com"};
    this.client.call('HealthCheck', body)
      .subscribe((res: ISoapMethodResponse) =>{
        this.message = res.result.AddResult;
        console.debug("buildXML();",this.message,res);
      });

  }

  async checkApplePay(){
    this.buildXML();
    await this.applePay.canMakePayments().then((message) => {
      console.log(message);
      this.presentAlert("SUCCESS","This device can make payments."+message.toString());
    }).catch((error) => {
      console.error("ERROR: checkApplePay().",error);
      this.presentAlert("FAILED","This device cannot make payments.");
    });
  }

  async presentAlert(title, message) {
    const alert = await this.alertController.create({
      header: title,
      message: message,
      buttons: ['OK']
    });

    await alert.present();
  }

  async applyPayNow(){
    this.applePay.startListeningForShippingContactSelection()
    .subscribe(async selection => {
      try {
        // await this.applePay.updateItemsAndShippingMethods({
        //   items: getFromSelection(selection),
        //   shippingMethods: getFromSelection(selection),
        // });
      }
      catch {
        // handle update items error
      }
    });
  }


  async payWithApplePay() {
    try {
      let order: any = {
        items: this.items,
        //shippingMethods: this.shippingMethods,
        merchantIdentifier: this.merchantIdentifier,
        currencyCode: this.currencyCode,
        countryCode: this.countryCode,
        billingAddressRequirement: this.billingAddressRequirement,
        shippingAddressRequirement: this.shippingAddressRequirement,
        //shippingType: this.shippingType,
        merchantCapabilities: this.merchantCapabilities,
        supportedNetworks: this.supportedNetworks
      }
      console.debug("Paying with ",order);
      this.applePay.makePaymentRequest(order).then(message => {
        //sample: when success - apple will pass back the token:
        // {
        // paymentData: "xxxxxxxxxx"
        // paymentMethodDisplayName: "Visa 9999"
        // paymentMethodNetwork: "Visa"
        // paymentMethodTypeCard: "debit"
        // transactionIdentifier: "123334343"
        // }

        console.log("makePaymentRequest() SUCCESS",message);
        this.applePay.completeLastTransaction('success');
      }).catch((error) => {
        console.error("makePaymentRequest() FAILED",error);
        this.applePay.completeLastTransaction('failure');
        this.presentAlert("failure","Cannot complete");
      });

      // In real payment, this step should be replaced by an actual payment call to payment provider
      // Here is an example implementation:

      // MyPaymentProvider.authorizeApplePayToken(token.paymentData)
      //    .then((captureStatus) => {
      //        // Displays the 'done' green tick and closes the sheet.
      //        ApplePay.completeLastTransaction('success');
      //    })
      //    .catch((err) => {
      //        // Displays the 'failed' red cross.
      //        ApplePay.completeLastTransaction('failure');
      //    });

    } catch {
      // handle payment request error
      // Can also handle stop complete transaction but these should normally not occur
    }
  }

}
