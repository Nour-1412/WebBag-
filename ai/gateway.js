import { runImgly } from "./providers/imgly.js";

export async function runGateway(file) {

    const result = await runImgly(file);

    return result;

}
