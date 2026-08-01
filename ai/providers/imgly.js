// Imgly Provider

export async function runImgly(file) {

    try {

        const blob = await removeBackground(file);

        return {

            success: true,

            provider: "imgly",

            image: blob

        };

    }

    catch(error){

        return {

            success:false,

            provider:"imgly",

            error:error.message

        };

    }

}
