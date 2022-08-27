import { param } from "express-validator";

class StripeValidator {
    field;

    constructor() {
        this.field = {};
    }

    createStripeCharge = () => {
        return {
            amount: {
                optional: {
                    options: { nullable: true },
                },
            },
            album_id: {
                optional: {
                    options: { nullable: true },
                },
            },
            card_id: {
                optional: {
                    options: { nullable: true },
                },
            },
        };
    };
}

export default new StripeValidator();
