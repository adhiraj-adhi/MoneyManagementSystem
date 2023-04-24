/* ========= DOCUMENTATION GOES HERE =============== 

refresher => This function refreshes the errorMessage so that every time errorMessage's properties have values according to error

signin_get => Serves the signin page whenever "/" is hit with request type get

signup_get => Serves the signup page whenever "/signup" is hit with request type get

signup_post => this will create the user in database and will render login page with message to verify email

sendEmail => Takes up the data of user and sends verification email to user after successful registration

resendCode_get => Render a form to enter registered email for resending code

resendCode_post => Finds the user in database with email provided and resends the verification code.

userVerified => sets the flag isVerified to true after user verification is done

signin_post => Will log in the user and generate the token

profile_get => Renders the profile/ home page

(addLender_get, addLender_post), (addDeals_get, addDeals_post) => For rendering the webpage to create and save lender and Deals respectively

deals_get => For rendering deals page that shows deals between user and lender

editDeal_get, editDeal_post => For rendering the webpage to edit and save deal respectively
*/





const UserModel = require("../src/model/DefModel");
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// errorMessage will contain the errors to be shown on sigIn or signUp page
let errorMessage = {
    verifierMessage: '',
    loginError: '',
    name: '',
    email: '',
    password: '',
    resendCodeErr: '',
    lenderName: '',
    lenderEmail: '',
    amount: '',
    message: ''
};

function refresher() {
    errorMessage = {
        verifierMessage: '',
        loginError: '',
        name: '',
        email: '',
        password: '',
        resendCodeErr: '',
        lenderName: '',
        lenderEmail: '',
        amount: '',
        message: ''
    }
}


// function for handling errors
const handleErrors = (err) => {
    refresher();
    console.log(err.message);
    if (err.message === 'Passwords and Confirm Passwords Must Be Same') {
        errorMessage.password = 'Passwords and Confirm Passwords Must Be Same'
    }
    if (err.message.includes('data validation failed')) {
        Object.values(err.errors).forEach(({ properties }) => {
            errorMessage[properties.path] = properties.message;
        })
    }
    if (err.code === 11000) {
        errorMessage.email = 'Email Already Registered'
    }
    if (err.message === 'No Such User Found') {
        errorMessage.loginError = 'No Such User Found';
    }
    if (err.message === 'Invalid Credentials') {
        errorMessage.loginError = 'Invalid Credentials'
    }
    if (err.message === 'Please Verify Your Email To Login') {
        errorMessage.verifierMessage = 'Please Verify Your Email To Login'
    }
    if (err.message === 'Email not registered') {
        errorMessage.resendCodeErr = 'Email not registered'
    }

}

// function to send Verification Email 
const sendEmail = (id, email, name) => {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.Email,
            pass: process.env.Pass
        },
    });

    const token = jwt.sign({ id }, process.env.VERIFY_EMAIL, { expiresIn: '7m' })

    const mailOptions = {
        from: process.env.Email,
        to: email,
        subject: 'Verification Email',
        html: `<p> Hello ${name}, to verify your email please click on <a href="http://localhost:8000/userVerified/${token}">Verify</a></p>`
        // html: `<p> Hello ${data.name}, to verify your email please click on <a href="https://c544-2405-201-9009-9188-b571-f52c-5cee-c8b5.in.ngrok.io/createUser/${token}">Verify</a></p>`
        // html: `<p> Hello ${name}, to verify your email please click on <a href=" https://c41b-2405-201-9009-9018-fdf6-7b19-90e8-185d.ngrok-free.app/userVerified/${token}">Verify</a></p>`
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log("Email sent" + info.response);
        }
    });
}


const signin_get = (req, res) => {
    refresher();
    res.render("signIn", { data: errorMessage });
}


const signup_get = (req, res) => {
    res.render("signUp", { data: errorMessage });
}


const signup_post = async (req, res) => {
    try {
        if (req.body.password === req.body.confPassword) {
            const { name, email, password } = req.body;
            const user = new UserModel({
                name: name,
                email: email,
                password: password
            });
            const result = await user.save();
            if (result) {
                sendEmail(result._id, result.email, result.name);
                refresher();
                errorMessage.verifierMessage = "Please Verify Your Email To Login";
                res.render("signIn", { data: errorMessage })
            }
        } else {
            throw new Error("Passwords and Confirm Passwords Must Be Same");
        }
    } catch (error) {
        handleErrors(error);
        res.render("signUp", { data: errorMessage })
    }
}


const resendCode_get = (req, res) => {
    res.render("resendCode", { data: errorMessage });
}

const resendCode_post = async (req, res) => {
    try {
        const email = req.body.email;
        const user = await UserModel.findOne({ email: email })
        if (user) {
            sendEmail(user._id, user.email, user.name);
            refresher();
            errorMessage.verifierMessage = "Please Verify Your Email To Login";
            res.render("signIn", { data: errorMessage })
        } else {
            throw new Error("Email not registered");
        }
    } catch (error) {
        handleErrors(error);
        res.render("resendCode", { data: errorMessage })
    }
}

const userVerified = async (req, res) => {
    try {
        errorMessage.verifierMessage = '';
        const decoded = jwt.verify(req.params.token, process.env.VERIFY_EMAIL)
        const id = decoded.id; // getting id back from token
        // console.log(id);
        const user = await UserModel.findById({ _id: id });
        user.isVerified = true;
        const result = await user.save();
        if (result) {
            refresher();
            res.render("signIn", { data: errorMessage })
        }
    } catch (error) {
        // handleErrors(error);
        // console.log(error);
        if (error.message === 'jwt expired') {
            res.send("OOPS!This Link Has Expired")
        }
    }
}


const signin_post = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await UserModel.login(email, password); // login is defined in Defodel.js
        let id = user._id.valueOf();
        const token = jwt.sign({ id }, process.env.PRIVATE_KEY, { expiresIn: '3d' });
        res.cookie("userLoggedIn", token, { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 3 });
        res.redirect(`/profile/${id}`);
    } catch (error) {
        handleErrors(error);
        res.render("signIn", { data: errorMessage })
    }
}


const profile_get = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await UserModel.findById({ _id: id });
        res.render("profile", { data: user });
    } catch (error) {
        console.log(error);
    }
}

const addLender_get = async (req, res) => {
    try {
        const id = req.params.id;
        const user = await UserModel.findById({ _id: id });
        res.render("addLender", { data: user, error: errorMessage });
    } catch (error) {
        console.log(error);
    }
}


const addLender_post = async (req, res) => {
    let user;
    try {
        const id = req.params.id;
        user = await UserModel.findById({ _id: id });
        user.deals.push(req.body);
        const result = await user.save();
        if (result) {
            res.redirect(`/profile/${id}`);
        }
    } catch (error) {
        handleErrors(error);
        res.render("addLender", { data: user, error: errorMessage });
    }
}


const deals_get = async (req, res) => {
    try {
        const ids = req.params;
        const user = await UserModel.findById({ _id: ids.id });
        const lender = await user.deals.id(ids.lendersId);
        res.render("deals", { data: user, lender: lender, ids: ids });
    } catch (error) {
        console.log(error);
    }
}

const addDeals_get = async (req, res) => {
    try {
        const ids = req.params;
        const user = await UserModel.findById({ _id: ids.id });
        // const lender = await user.deals.id(ids.lendersId);
        refresher();
        res.render("addDeal", { data: user, ids: ids, errorMessage: errorMessage });
    } catch (error) {
        console.log(error);
    }
}

const addDeals_post = async (req, res) => {
    let user;
    let ids;
    try {
        const data = req.body;
        console.log(data);
        ids = req.params;
        user = await UserModel.findById({ _id: ids.id });
        const lender = await user.deals.id(ids.lendersId);
        if (data.typeOfDeal === "You Got") {
            const deal_obj = {
                amount: data.amount,
                message: data.message
            };
            lender.price.push(deal_obj);
        } else {
            const deal_obj = {
                amount: -data.amount,
                message: data.message
            };
            lender.price.push(deal_obj);
        }
        const result = await user.save();
        if (result) {
            res.redirect(`/deals/${ids.id}/${ids.lendersId}`);
        }
    } catch (error) {
        console.log(error);
        handleErrors(error);
        res.render("addDeal", { data: user, ids: ids, errorMessage: errorMessage });
    }
}

const editDeal_get = async (req, res) => {
    try {
        const ids = req.params;
        const user = await UserModel.findById({ _id: ids.id });
        const lender = await user.deals.id(ids.lendersId);
        const deal = await lender.price.id(ids.dealsId);
        refresher();
        res.render("editDeal", { data: user, deal: deal, ids: ids, errorMessage: errorMessage });
    } catch (error) {
        console.log(error);
    }
}

const editDeal_post = async (req, res) => {
    let user, deal;
    let ids;
    try {
        const data = req.body;
        console.log(data);
        ids = req.params;
        user = await UserModel.findById({ _id: ids.id });
        const lender = await user.deals.id(ids.lendersId);
        deal = await lender.price.id(ids.dealsId);
        const index = lender.price.indexOf(deal);
        if (data.typeOfDeal === "You Got") {
            // const editedDeal = {
            //     amount : data.amount,
            //     message : data.message,
            //     date : deal.date
            // }
            // lender.price.splice(index, 1, editedDeal);
            deal.amount = data.amount;
            deal.message = data.message;
        } else {
            // const editedDeal = {
            //     amount : -data.amount,
            //     message : data.message,
            //     date : deal.date
            // }
            // lender.price.splice(index, 1, editedDeal);
            deal.amount = -data.amount;
            deal.message = data.message;
        }
        const result = await user.save();
        if (result) {
            res.redirect(`/deals/${ids.id}/${ids.lendersId}`);
        }
    } catch (error) {
        handleErrors(error);
        res.render("editDeal", { data: user, deal: deal, ids: ids, errorMessage: errorMessage });
    }
}



const deleteDeal_get = async (req, res) => {
    try {
        const ids = req.params;
        res.render("confirmDeletion", { ids : ids })
    } catch (error) {
        console.log(error);
    }
}


const confirm_delete = async (req, res) => {
    try {
        const ids = req.params;
        const user = await UserModel.findById({ _id: ids.id });
        const lender = await user.deals.id(ids.lendersId);
        const deal = await lender.price.id(ids.dealsId);
        const index = lender.price.indexOf(deal);
        lender.price.splice(index, 1);
        const result = await user.save();
        if(result){
            res.redirect(`/deals/${ids.id}/${ids.lendersId}`);
        }
    } catch (error) {
        console.log(error);
    }
}

const logout = (req, res) => {
    const token = jwt.sign({ data: 'LogOutToken' }, process.env.PRIVATE_KEY, { expiresIn: '1s' });
    res.cookie("userLoggedIn", token, { httpOnly: true, maxAge: 1000 });
    res.redirect("/");
}

module.exports = {
    signin_get,
    signup_get,
    signup_post,
    resendCode_get,
    resendCode_post,
    userVerified,
    signin_post,
    profile_get,
    addLender_get,
    addLender_post,
    deals_get,
    addDeals_get,
    addDeals_post,
    editDeal_get,
    editDeal_post,
    deleteDeal_get,
    confirm_delete,
    logout
};