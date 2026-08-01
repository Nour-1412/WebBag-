export async function runImgly(file) {

    try {

        const blob = await removeBackground(file);

        return {

            success: true,

            image: blob

        };

    }

    catch(error){

        return {

            success: false,

            error: error.message

        };

    }

}
