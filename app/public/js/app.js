const chunk = require('chunk')
const datamaker = require('datamaker')
const async = require('async')
const Cloudant = require('@cloudant/cloudant')
const { shell } = require('electron')

const generateExample = async (template) => {
  return new Promise((resolve, reject) => {
    let retval = ''
    datamaker.generate(template, 'none', 1)
      .on('data', (d) => { 
        try {
          const obj = JSON.parse(d)
          retval = JSON.stringify(obj, null, 2)
        } catch(e) {
        }
      })
      .on('end', (d) => { resolve(retval)} )
  })
}

var dataTypes = [
  {
    name: 'user',
    target: 'users',
    description: 'A registered user with name, email, address etc.',
    icon: 'fa-user',
    image: 'img/users.png',
    example: {
      "_id": "abc123",
      "type": "user",
      "name": "Bob Smith",
      "email": "bob.smith@aol.com",
      "password": "1f6b5d0e151388786d3820cded9408e2",
      "salt": "43614d9b1dec23da34a5b6f4eb71fb59",
      "active": true,
      "email_verified": true,
      "address": "19 Front Street, Darlington, DL5 1TY",
      "joined": "2019-01-24T10:42:99.000Z"
    },
    datamaker: '{\n' +
      '  "_id": "{{uuid}}",\n' +
      '  "type": "user",\n' +
      '  "name": "{{name}}",\n' +
      '  "email": "{{email}}",\n' +
      '  "password": "{{md5}}",\n' +
      '  "salt": "{{md5}}",\n' +
      '  "active": true,\n' +
      '  "email_verified": {{boolean 0.80}},\n' +
      '  "address": "{{street}},{{town}},{{county}},{{postcode}}",\n' +
      '  "joined": "{{date_iso 2019-01-01}}"\n' +
      '}\n'
  },
  {
    name: 'order',
    target: 'orders',
    description: 'An order from an e-commerce store',
    icon: 'fa-shopping-basket',
    example: {
      "_id": "0007741142412418284",
      "type": "order",
      "user": "Bob Smith",
      "orderid": "0007741142412418284",
      "userid": "abc123",
      "basket": [
         { 
            "name": "Salter - Digital Kitchen Scales", 
            "price": 14.99
        },
         {   
              "name": "Kenwood - Stand Mixer",
              "price": 199.99
        }
       ],
      "total": 214.98,
      "deliveryAddress": "19 Front Street, Darlington, DL5 1TY",
      "delivered": "true",
      "courier": "UPS",
      "courierid": "15125425151261289",
      "date": "2019-01-28T10:44:22.000Z"
    },
    datamaker: '{\n' +
      '  "_id": "{{kuuid 2019-01-01}}",\n' +
      '  "type": "order",\n' +
      '  "user": "{{name}}",\n' +
      '  "orderid": "{{last kuuid}}",\n' +
      '  "userid": "{{uuid}}",\n' +
      '  "basket": [{"name": "{{words 3}}","price": {{price}}}],\n' +
      '  "total": {{last price}},\n' +
      '  "deliveryAddress": "{{street}}, {{town}}, {{county}}, {{postcode}}",\n' +
      '  "delivered": {{boolean 0.99}},\n' +
      '  "courier": "{{oneof UPS Hermes Parcelforce DPD TNT}}",\n' +
      '  "courierid": "{{digits 12}}",\n' +
      '  "date": "{{date_iso 2019-01-01}}"\n' +
      '}\n'
  },
  {
    name: 'product',
    target: 'products',
    description: 'An product for sale in an e-commerce store',
    icon: 'fa-dog',
    example: {
      "_id": "small-appliances:1000042",
      "type": "product",
      "taxonomy": ["Home","Kitchen","Small Appliances"],
      "keywords": ["Salter","Scales","Weight","Digital","Kitchen"],
      "productid": "1000042",
      "brand": "Salter",
      "name": "Digital Kitchen Scales",
      "description": "Slim Colourful Design Electronic Cooking Appliance for Home / Kitchen, Weigh up to 5kg + Aquatronic for Liquids ml + fl. oz. 15Yr Guarantee - Green",
      "colours": ["red","green","black","blue"],
      "price": 14.99,
      "image": "assets/img/0gmsnghhew.jpg"
    },
    datamaker: '{\n' +
      '  "_id": "{{oneof pets books kitchen household food drink dvd bakery}}:{{uuid}}",\n' +
      '  "type": "product",\n' +
      '  "taxonomy": ["Home","{{last oneof}}"],\n' +
      '  "keywords": ["{{word}}","{{word}}","{{word}}"],\n' +
      '  "productid": "{{last uuid}}",\n' +
      '  "brand": "{{oneof Danube Lancaster McMaster Smith Jones Falcon Frampton}}",\n' +
      '  "name": "{{words 3}}",\n' +
      '  "description": "{{words 25}}",\n' +
      '  "colours": ["{{oneof red green blue}}","{{oneof yellow orange black white purple}}"],\n' +
      '  "price": {{price}},\n' +
      '  "image": "{{url}}"\n' +
      '}\n'
  },
  {
    name: 'event',
    target: 'events',
    description: 'Events recording interactions on an website',
    icon: 'fa-clock',
    example:{
        "_id": "0007241142412418284",
        "type": "event",
        "userid": "abc123",
        "eventType": "addedToBasket",
        "productId": "1000042",
        "date": "2019-01-28T10:44:22.000Z"
    },
    datamaker: '{\n' +
      '  "_id": "{{kuuid}}",\n' +
      '  "type": "event",\n' +
      '  "userid": "{{digits 4}}",\n' +
      '  "eventType": "{{oneof addedToBasket viewed liked shared searched login logout}}",\n' +
      '  "productId": "{{uuid}}",\n' +
      '  "date": "{{date_iso 2019-01-28}}"\n' +
      '}\n'
  },
  {
    name: 'store (GeoJSON)',
    target: 'stores',
    description: 'Phyical store locations with latitude, longitude, address and contact details',
    icon: 'fa-store',
    example: {
      "_id": "2151251215",
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [125.6, 10.1]
      },
      "properties": {
        "type": "store",
        "name": "Manchester",
        "address": {
           "street": "15 Front St",
           "town": "Manchester",
           "postcode": "M1 6HJ",
        },
        "telephone": "01619885522"
      }
    },
    datamaker: '{\n' +
      '  "_id": "{{uuid}}",\n' +
      '  "type": "Feature",\n' +
      '  "geometry": {\n' +
      '    "type": "Point",\n' +
      '    "coordinates": [{{latitude}}, {{longitude}}]\n' +
      '  },\n' +
      '  "properties": {\n' +
      '    "type": "store",\n' +
      '    "name": "{{town}}",\n' +
      '    "address": {\n' +
      '       "street": "{{street}}",\n' +
      '       "town": "{{last town}}",\n' +
      '       "postcode": "{{postcode}}"\n' +
      '    },\n' +
      '    "telephone": "{{tel}}"\n' +
      '  }\n' +
      '}\n'
  },
  {
    name: 'Custom',
    target: 'custom',
    description: 'You decide which data are generatered',
    icon: 'fa-lightbulb',
    example: {
    },
    datamaker: '{\n}'
  }
]

const Store = require('electron-store');
const store = new Store();

var app = new Vue({
  el: '#app',
  data: {
    step: 0,
    message: 'Hello Vue!',
    settingsPanel: false,
    dataTypes: dataTypes,
    validJSON: true,
    chosenDataType: null,
    exampleStr: '',
    chosen: -1,
    generating: false,
    progress: 0,
    writeerror: null,
    settings: {
      couchURL: '',
      iamAPIKey: '',
      numRecords: 1000,
      targetDatabase: ''
    }
  },
  watch: {
    chosenDataType:  {
      handler: async function(val, oldval) {
        const self = this
        const str = await generateExample(val.datamaker)
        self.validJSON = false
        try {
          if (!str) {
            throw('Invalid JSON')
          }
          JSON.parse(str)
          self.validJSON = true
          self.exampleStr = str
        } catch (e) {
          self.exampleStr = 'Invalid JSON'
        }
        
      },
      deep: true
    }
  },
  computed: {
    chunkedDataTypes() {
      return chunk(this.dataTypes, 3)
    }
  },
  created: function() {
    this.settings.couchURL = store.get('couchURL')
    this.settings.iamAPIKey = store.get('iamAPIKey')
  },
  methods: {
    settingsClick: function() {
      this.settingsPanel = !this.settingsPanel
      this.step = 1
    },
    getStartedClicked: function() {
      this.step = 1
      if (!this.settings.couchURL) {
        this.settingsPanel = true
      }
    },
    settingsSubmitClicked: function() {
      store.set('couchURL', this.settings.couchURL)
      if (this.settings.iamAPIKey) {
        store.set('iamAPIKey', this.settings.iamAPIKey)
      } else {
        store.delete('iamAPIKey')
      }
      this.settingsPanel = false
      this.step = 1
    },
    chooseClicked: async function(dt) {
      this.chosenDataType = dt
      this.exampleStr = await generateExample(this.chosenDataType.datamaker)
      this.settings.targetDatabase = this.chosenDataType.target
      this.step = 2
    },
    generateClicked: async function() {
      this.step = 3

      // cloudant lib
      this.step 
      const opts = { 
        url: this.settings.couchURL, 
        maxAttempt: 5
      }
      if (this.settings.iamAPIKey) {
        opts.plugins = [ { iamauth: { iamApiKey: this.settings.iamAPIKey } }]
      }
      var cloudant = new Cloudant(opts);
      try {
        await cloudant.db.create(this.settings.targetDatabase)
      } catch (e) {
      }
      const db = cloudant.db.use(this.settings.targetDatabase)


      const self = this
      this.writeerror = null
      this.generating = true
      this.progress = 0
      const template = this.chosenDataType.datamaker
      const format = 'json'
      let count = 0
      const targetCount = parseInt(this.settings.numRecords)
      async.doUntil(async () => {
        return new Promise((resolve, reject) => {
          const iterations = Math.min(targetCount - count, 500)
          count += iterations
          const records = []
          datamaker.generate(template, format, iterations)
            .on('data', (d) => { records.push(JSON.parse(d)) })
            .on('end', async (d) => { 
              try {
                await db.bulk({docs:records})
              } catch(e) {
                self.writeerror = e
              }
              this.progress = 100 * count/targetCount
              resolve()
            })
        })
      }, async () => {
        return (count >= targetCount || self.writeerror)
      }, function() {
        self.step = 4
        self.generating = false
      })
    }
  }
})

