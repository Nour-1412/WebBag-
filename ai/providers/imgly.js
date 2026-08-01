export async function runImgly(file) {

    if (!window.removeBackground) {

        return {

            success: false,

            error: "مكتبة Imgly غير محملة."

        };

    }

    try {

        const blob = await window.removeBackground(file);

        return {

            success: true,

            image: blob

        };

    }

    catch (error) {

        return {

            success: false,

            error: error.message

        };

    }

}
