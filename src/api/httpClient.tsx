import axios, {AxiosRequestConfig} from "axios";
import {EX_RATE_KEY} from "./keys";

const CURRENCY_URL = `https://v6.exchangerate-api.com/v6/${EX_RATE_KEY}/`;

const defaultOptions = (): AxiosRequestConfig => {
    return { baseURL: CURRENCY_URL };
}

const httpClient = axios.create(defaultOptions());

export default httpClient;
