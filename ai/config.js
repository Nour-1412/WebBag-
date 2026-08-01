// WebBag AI Configuration

export const AI_CONFIG = {

    defaultProvider: "imgly",

    fallbackProvider: "segmind",

    providers: {

        imgly: {

            enabled: true,

            name: "Imgly Browser AI"

        },

        segmind: {

            enabled: true,

            endpoint: "/api/remove-background",

            name: "Segmind Cloud AI"

        }

    }

};

