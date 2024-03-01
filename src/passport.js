import passport from "passport";
import { Users } from "../src/DAL/dao/MongoDB/usersManagerDB.js";
import { Cart } from '../src/DAL/dao/MongoDB/cartsManagerDB.js'
import { ExtractJwt, Strategy as JWTStrategy } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as GithubStrategy } from "passport-github2";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { hashData, compareData } from "./utils";
import UsersResponse from "./DAL/dto/users-response.dto.js";

import config from "../src/config/configs.js";


const secretKeyJwt = config.secret_jwt;
passport.use("signup", new LocalStrategy(
        { passReqToCallback: true, usernameField: "email" },
        async (req, email, password, done) => {
        const { name, lastName } = req.body;
        if (!name || !lastName || !email || !password) {
            return done(null, false, {message: 'All fields are required'});
        }
        
        const cart = await Cart.createOne();
        
        try {
            const hashedPassword = await hashData(password);
            const createdUser = await Users.createOne({
            ...req.body,
            password: hashedPassword,
            cartId : cart._id,
            });
            done(null, createdUser);
        } catch (error) {
            done(error);
        }
        }
    )
);


passport.use("login", new LocalStrategy(
    { usernameField: "email" },
    async (email, password, done) => {
        const req = this;
        if (!email || !password) {
            return done(null, false, { message: "Email and password are required" });
        }
        try {
            const user = await Users.findByEmail(email);
            if (!user) {
                return done(null, false, { message: "User not found" });
            }
            
            const isPasswordValid = await compareData(password, user.password);
            if (!isPasswordValid) {
                return done(null, false, { message: "Invalid password" });
            }
            
            return done(null, user);
        } catch (error) {
            return done(error); 
        }
    }
));


passport.use("github", 
    new GithubStrategy (
        {
        clientID: "Iv1.f644c6a8ca45697d",
        clientSecret: "23f83507f12a37c5e5fad41860d63ddee5f9a8d7",
        callbackURL: "http://localhost:8080/api/session/callback",
        scope: ["user:email"],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                
                const userDB = await Users.findByEmail(profile.emails[0].value);
                
                if (userDB) {
                    return done(null, userDB);
                    } 
                const cart = await Cart.createOne();
               
                const infoUser = {
                    name: profile._json.name.split(" ")[0], 
                    lastName: profile._json.name.split(" ")[1],
                    email: profile.emails[0].value,
                    password: " ",
                    cartId: cart._id,
                };
                const createdUser = await Users.createOne(infoUser);
                done(null, createdUser);
                } catch (error) {
                done(error);
                }
        }
    )
);

passport.use("google", 
    new GoogleStrategy (
        {
        clientID: "",
        clientSecret: "",
        callbackURL: "http://localhost:8080/api/session/auth/google/callback",
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const userDB = await Users.findByEmail(profile._json.email);
                if (userDB) {
                    return done(null, userDB);
                    } 
               
                const cart = await Cart.createOne();

                const infoUser = {
                    name: profile._json.given_name,
                    lastName: profile._json.family_name,
                    email: profile._json.email,
                    password: " ",
                    cartId: cart._id,                };
                const createdUser = await Users.createOne(infoUser);
                done(null, createdUser);
                } catch (error) {
                done(error);
                }
        }
    )
);
const fromCookies = (req) => {
    return req.cookies.token;
}
passport.use('current', new JWTStrategy({
    jwtFromRequest: ExtractJwt.fromExtractors([fromCookies]),
    secretOrKey: secretKeyJwt,
}, async (jwt_payload, done) => {
    try {
       const user = await Users.findByEmail(jwt_payload.mail);
       if (!user) {
            return done(null, false, { message: 'Usuario no encontrado' });
        }
        const userDTO =  new UsersResponse(user)
        return done(null, userDTO);}
            catch (error) {
                return error
            }
}));

passport.use(
    "jwt",
    new JWTStrategy(
    {
        jwtFromRequest: ExtractJwt.fromExtractors([fromCookies]),
        secretOrKey: secretKeyJwt,
    },
    async function (jwt_payload, done) {
       done(null, jwt_payload);
    }
    )
);

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Users.findById(id);
        done(null, user);
    } catch (error) {
        done(error);
    }
});