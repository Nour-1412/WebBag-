import { AI_CONFIG } from "./config.js";

export async function runGateway(file) {

    const defaultProvider = AI_CONFIG.defaultProvider;

    if (defaultProvider === "imgly") {

        return {

            provider: "imgly",

            success: true

        };

    }

    if (defaultProvider === "segmind") {

        return {

            provider: "segmind",

            success: true

        };

    }

    throw new Error("لا يوجد مزود AI صالح.");

}

