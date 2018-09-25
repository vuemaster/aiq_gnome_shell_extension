
const St = imports.gi.St;
const Main = imports.ui.main;
const Lang = imports.lang;
const PanelMenu = imports.ui.panelMenu;
const Clutter = imports.gi.Clutter;
const Mainloop = imports.mainloop;
const Soup = imports.gi.Soup;
const Util = imports.misc.util;

const TIMEOUT = 10 //seconds
const BASE_URL_BINANCE = 'https://api.binance.com/api/v1/ticker/24hr';
const BASE_URL_FREIEX = 'https://freiexchange.com/api/public/'
const BASE_TRADEVIEW_URL_FREIEX = 'https://freiexchange.com/market/'
const BASE_TRADEVIEW_URL_BINANCE = 'https://www.binance.com/tradeDetail.html?symbol='
const BASE_URL_BITPANDA = 'https://api.bitpanda.com/v1/ticker'
const BASE_TRADEVIEW_URL_BITPANDA = 'https://cointicker.online/'
const symbols = [
    {
        symbol: 'AIQ/BTC',
        tradeSymbol: 'AIQ',
        name: 'AIQ',
        decimals: 8,
        removeZero:true,
        url: BASE_URL_FREIEX,
        url_trade: BASE_TRADEVIEW_URL_FREIEX,
    },
    {
        symbol: 'PAN',
        tradeSymbol: 'PAN',
        name: 'PAN',
        decimals: 4,
        removeZero: false,
        url: BASE_URL_BITPANDA,
        url_trade: BASE_TRADEVIEW_URL_BITPANDA,
    },
    {
        symbol: 'TNBBTC',
        tradeSymbol: 'TNB_BTC',
        name: 'TNB',
        decimals: 8,
        removeZero: true,
        url: BASE_URL_BINANCE,
        url_trade: BASE_TRADEVIEW_URL_BINANCE,
    },
    {
        symbol: 'LENDBTC',
        tradeSymbol: 'LEND_BTC',
        name: 'LEND',
        decimals: 8,
        removeZero: true,
        url: BASE_URL_BINANCE,
        url_trade: BASE_TRADEVIEW_URL_BINANCE,
    },
    {
        symbol: 'XLMBTC',
        tradeSymbol: 'XLM_BTC',
        name: 'XLM',
        decimals: 8,
        removeZero: true,
        url: BASE_URL_BINANCE,
        url_trade: BASE_TRADEVIEW_URL_BINANCE,
        
    },
    {
        symbol: 'ADABTC',
        tradeSymbol: 'ADA_BTC',
        name: 'ADA',
        decimals: 8,
        removeZero: true,
        url: BASE_URL_BINANCE,
        url_trade: BASE_TRADEVIEW_URL_BINANCE,
    },
    {
        symbol: 'SUBBTC',
        tradeSymbol: 'SUB_BTC',
        name: 'SUB',
        decimals: 8,
        removeZero: true,
        url: BASE_URL_BINANCE,
        url_trade: BASE_TRADEVIEW_URL_BINANCE,
    },
    {
        symbol: 'ETHBTC',
        tradeSymbol: 'ETH_BTC',
        name: 'E',
        decimals: 8,
        removeZero: true,
        url: BASE_URL_BINANCE,
        url_trade: BASE_TRADEVIEW_URL_BINANCE,
    },
    {
        symbol: 'BTCUSDT',
        tradeSymbol: 'BTC_USDT',
        name: 'B',
        decimals: 0,
        url: BASE_URL_BINANCE,
        url_trade: BASE_TRADEVIEW_URL_BINANCE,
    }
];

const Ticker = new Lang.Class({
    Name: 'Ticker BaseClass',
    Extends: PanelMenu.Button,

    _init: function(symbol) {
        this.parent(0.0, symbol.name + ' ticker', false);
        this.label = new St.Label({ text: symbol.name, y_align: Clutter.ActorAlign.CENTER });
        this.actor.add_actor(this.label);
        this.actor.connect('button-press-event', Lang.bind(this, this._openBrowser))
        this._symbol = symbol;
        this._refresh();
    },

    _openBrowser: function() {
        if (this._symbol.url == BASE_URL_BINANCE) {
            let url = this._symbol.url_trade + this._symbol.tradeSymbol
            Util.spawnCommandLine("xdg-open " + url)
        }else if (this._symbol.url == BASE_URL_FREIEX) {
            let url = this._symbol.url_trade + this._symbol.tradeSymbol + '/BTC'
            Util.spawnCommandLine("xdg-open " + url)
        }
    },

    _refresh: function() {
        this._loadData(this._refreshUI);
        this._removeTimeout();
        this._timeout = Mainloop.timeout_add_seconds(TIMEOUT, Lang.bind(this, this._refresh))
        return true
    },

    _loadData: function() {
        if (this._symbol.url == BASE_URL_BINANCE) {
            let params = { symbol: this._symbol.symbol };
            this._httpSession = new Soup.Session();
            let _httpSession = this._httpSession
            let message = Soup.form_request_new_from_hash('GET', this._symbol.url, params)
            this._httpSession.queue_message(message, Lang.bind(this, function(httpSession, message) {
                if (message.status_code !== 200) {
                    global.log(message);
                    return;
                }
                let json = JSON.parse(message.response_body.data);
                this._refreshUI(json)
            }))
        }else if (this._symbol.url == BASE_URL_FREIEX) {
            this._httpSession = new Soup.Session();
            let _httpSession = this._httpSession
            let message = Soup.Message.new('GET', this._symbol.url+this._symbol.symbol)
            this._httpSession.queue_message(message, Lang.bind(this, function(httpSession, message) {
                if (message.status_code !== 200) {
                    global.log(message);
                    return;
                }
                let json = JSON.parse(message.response_body.data)
                this._refreshUI(json)
            }))
        }
    },

    _refreshUI: function(data) {
        let text = this._symbol.name + ': '
        let removeZeroRegex = /(?![0\.])(\d*)/g;
        let value = 0
        //process different ways to retrieve data from exchanges
        if (this._symbol.url == BASE_URL_BINANCE) {
            value = Number(data.lastPrice).toFixed(this._symbol.decimals);
        }else if (this._symbol.url == BASE_URL_FREIEX) {
            value = Number(data.public.last).toFixed(this._symbol.decimals);
        }
        if (this._symbol.removeZero) {
            text += removeZeroRegex.exec(value)[0]
        } else {
            text += value
        }
        this.label.set_text(text);
    },

    _removeTimeout: function() {
        if (this._timeout) {
            Mainloop.source_remove(this._timeout);
            this._timeout = null;
        }
    },

    stop: function() {
        if (this._httpSession) {
            this._httpSession.abort();
        }
        this._httpSession = undefined;

        if(this._timeout) {
            Mainloop.source_remove(this._timeout);
        }
        this._timeout = undefined;

        this.menu.removeAll();
    }
})

function init() {
}

function enable() {
    for (let i = 0; i < symbols.length; i++) {
        let ticker = new Ticker(symbols[i])
        symbols[i].ticker = ticker
        Main.panel.addToStatusArea(symbols[i].name + 'Menu', ticker)
    }
}

function disable() {
    for (let i = 0; i < symbols.length; i++) {
        symbols[i].ticker.stop();
        symbols[i].ticker.destroy();
    }
}
