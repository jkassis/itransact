import * as itransact from 'itransact-node'
import {createHmac} from 'crypto'
import request from 'request'

export declare interface Customer {
    id: string
    addresses: Array<Address>
    metadata: Metadata
    payment_sources: Array<PaymentSource>
    subscriptions: Array<Subscription>
}

export declare interface Address {
    line1: string
    line2?: string
    city: string
    state: string
    postal_code: string
    country?: string
}

export declare type Metadata = Array<{ key: string, value: string }>

export declare interface PaymentSource {
    id: string
    name: string
    type: string
    savings_account: string
    default: string
    credit_card: string
    check_card: string
    debit_card: string
    commercial_card: string
    prepaid_card: string
    hsa_fsa_account: string
    international_bin: string
    push_funds: string
    fast_funds: string
    last_four_digits: string
    drivers_license_last_four: string
    drivers_license_state: string
    ssn_last_four: string
    expired: string
    month: string
    year: string
    brand: string
    sec_code: string
    bank_name: string
    routing_number: string
}

export declare interface Card {
    name: string
    number: string
    cvv: string
    exp_month: string
    exp_year: string
}

export declare interface ACH {
    account_number: string
    routing_number: string
    phone_number: string
    sec_code: string
    savings_account: boolean
    name?: string
    check_number?: string
    drivers_license_number?: string
    drivers_license_state?: string
    ssn_last_four?: string
}

export declare type TokenID = string

export declare interface Token {
    token: string
    used: string
    payment_source: PaymentSource
}

export declare interface Subscription {
    id: string
    description: string
    status: string
    reps: string
    total: string
    recipe: {}
    payment_source: PaymentSource
    surcharge_amount: string
    payment_source_will_surcharge: string
}

export declare interface Payout {
    id: string
    amount: number
    authorization_code: string
    avs_category: string
    avs_response: string
    cvv_response: string
    status: string
    metadata: Metadata
    payment_source: PaymentSource
}

export declare interface PayoutReq {
    amount: number
    customer_id?: string
    card?: Card
    token?: TokenID
    payment_source_id?: string
    address?: Address
    order_number: string
    metadata?: Metadata
    send_merchant_receipt: boolean
    send_customer_receipt: boolean
}

export declare interface Credit {
    amount: number
    state: string
    settled: boolean
    surcharge_amount: string
}

export declare interface Transaction {
    id: string
    xid: string
    created: string,
    amount: number,
    tax: number,
    surcharge_amount: number,
    authorized_amount: number,
    authorization_code: string
    avs_category: string
    avs_response: string
    cvv_response: string
    balance: number,
    status: string
    settled: true,
    instrument: string
    metadata: Metadata
    payment_source: PaymentSource
    credits: Array<Credit>
}

export declare interface CustomerPostReq {
    metadata?: Metadata
    address?: Address
    token?: TokenID
    ach?: ACH
    card?: Card
}

export declare interface CustomerCreateReq extends CustomerPostReq {
    swipe_data?: string
}

export declare interface CustomerUpdateReq extends CustomerPostReq {
    id: string
    default_payment_source_id?: string
}

export declare interface TokenCreateReq {
    address: Address
    ach?: ACH
    card?: Card
}

export declare interface TransactionCreateReq {
    amount: number
    customer_id?: string
    payment_source_id?: string
    card?: Card
    ach?: ACH
    token?: TokenID
    swipe_data?: string
    address?: Address
    capture: boolean
    tax: number
    order_number: string
    metadata?: Metadata
    send_merchant_receipt: boolean
    send_customer_receipt: boolean
}

export class API {
    apiEnv: string
    apiUser: string
    apiKey: string
    urlBase: string

    constructor(apiEnv: string, apiUser: string, apiKey: string) {
        this.apiEnv = apiEnv
        this.apiUser = apiUser
        this.apiKey = apiKey

        if (this.apiEnv == 'local') {
            this.urlBase = 'http://localhost:8080/'
        } else if (this.apiEnv == 'stage') {
            this.urlBase = 'https://stage.api.itransact.com/'
        } else {
            this.urlBase = 'https://api.itransact.com/'
        }
    }

    encode_username(apiUsername) {
        return Buffer.from(apiUsername, 'utf8').toString('base64')
    }

    async post<ResType>(urlEndpoint: string, payload: any): Promise<ResType> {
        const usernameEncoded = this.apiUser
        // const usernameEncoded = this.encode_username(this.apiUser)
        const payloadSignature = this.sign_payload(payload)
        const payloadJsonString = JSON.stringify(payload)

        return new Promise((resolve, reject) => {
            var req = {
                method: 'POST',
                uri: `${this.urlBase}${urlEndpoint}`,
                headers: {
                    'Authorization': `${usernameEncoded}:${payloadSignature}`,
                    'Content-Type': 'application/json',
                    'User-Agent': `Node.js ${process.version} - iTransact SDK x.x.x`
                },
                body: payloadJsonString
            }

            request(req, function (error, response, body) {
                if (error) {
                    reject(error)
                } else if (response && response.statusCode != 200 && response.statusCode != 201) {
                    reject(body)
                } else {
                    resolve(JSON.parse(body))
                }
            })
        })
    }

    sign_payload(jsonPayload: any): string {
        return createHmac('sha256', this.apiKey).update(JSON.stringify(jsonPayload)).digest('base64')
    }

    CustomerCreate(req: CustomerCreateReq): Promise<Customer> {
        return this.post<Customer>("customers", req)
    }

    CustomerUpdate(req: CustomerUpdateReq): Promise<Customer> {
        return this.post<Customer>(`customers?id=${req.id}`, req)
    }

    PayoutCreate(req: PayoutReq): Promise<Payout> {
        return this.post<Payout>(`payouts`, req)
    }

    PayoutGet(id: string): Promise<Payout> {
        return this.post<Payout>(`payouts/${id}`, {})
    }

    TokenCreate(req: TokenCreateReq): Promise<Token> {
        return this.post<Token>(`tokens`, req)
    }

    TransactionCreate(req: TransactionCreateReq): Promise<Transaction> {
        return this.post<Transaction>(`transactions`, req)
    }

    TransactionGet(id: string): Promise<Payout> {
        return this.post<Payout>(`transactions/${id}`, {})
    }
}