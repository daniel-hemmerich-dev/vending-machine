export interface Product {
    id ?: string 
    amountAvailable : number
    cost : number
    productName : string
    sellerId : string
}

export const enum UserRole {
    Seller = 'seller',
    Buyer = 'buyer'
}

export interface User {
    id ?: string
    username : string
    password : string
    deposit ?: number
    role : UserRole.Seller | UserRole.Buyer
}

export interface Error {
    value : string
    msg : string
    param : string
}