const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide your name"]
    },
    email: {
        type: String,
        required: [true, "Please provide email"],
        unique: true,
        validator(value) {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email");
            }
        }
    },
    password: {
        type: String,
        required: [true, "Please provide password"],
        minlength: [5, "Password must be atleast 5 character long"]
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    deals: {
        type: [{
            lenderName: {
                type: String,
                minlength: [3, "Atleast three character required in name"],
                required: [true, "Lender name can't be empty"],
            },
            lenderEmail: {
                type: String,
                required: [true, "Please provide email"],
                validator(value) {
                    if (!validator.isEmail(value)) {
                        throw new Error("Invalid Email");
                    }
                }
            },
            price: {
                type: [{
                    amount: {
                        type: Number,
                        required : [true, "Please provide amount"]
                    },
                    message: {
                        type: String,
                        minlength : [1, "Message Can't be empty"]
                    },
                    date : {
                        type : Date,
                        default : Date.now()
                    }
                }],
                default: []
            }
        }],
        default: []
    }
})


userSchema.statics.login = async function(email, password) {
    const user = await this.findOne({ email });
    if(user){
        if(user.isVerified) {
            if(user.password === password) {
                return user;
            } else {
                throw new Error("Invalid Credentials");
            }
        } else {
            throw new Error("Please Verify Your Email To Login")
        }
    } else {
        throw new Error("No Such User Found");
    }
}


const UserModel = new mongoose.model("data", userSchema);

module.exports = UserModel;