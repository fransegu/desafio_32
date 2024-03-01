import { findByEmail, findById, createOne } from "../service/user.service";
import { jwtValidation } from "../middlewares/jwt.middlware.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import passport from "passport";
import CustomError from "../errors/error.generate.js";
import { ErrorMessages, ErrorName } from "../errors/errors.enum.js";


export const findUserById = (req, res) => {
    passport.authenticate("jwt", { session: false }),
    async (req, res) => {
        const { idUser } = req.params;
        const user = await findById(idUser);
        if (!user) {
            return CustomError.generateError(ErrorMessages.USER_NOT_EXIST,404,ErrorName.USER_NOT_EXIST);
            }
        res.json({ message: "User", user });
}};

export const findUserByEmail = async (req, res) => {
    const { UserEmail } = req.body;
    const user = await findByEmail(UserEmail);
    if (!user) {
       return CustomError.generateError(ErrorMessages.USER_NOT_EXIST,404,ErrorName.USER_NOT_EXIST);
     }
    res.status(200).json({ message: "User found", user });
};

export const createUser =  async (req, res) => {
    const { name, lastName, email, password } = req.body;
    if (!name || !lastName || !email || !password) {
     return CustomError.generateError(ErrorMessages.ALL_FIELDS_REQUIRED,400,ErrorName.ALL_FIELDS_REQUIRED);

    }
    const createdUser = await createOne(req.body);
    res.status(200).json({ message: "User created", user: createdUser });
};