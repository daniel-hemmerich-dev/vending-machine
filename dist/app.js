'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("./auth"));
const user_1 = __importDefault(require("./user"));
// init the server
dotenv_1.default.config();
dotenv_1.default.config({ path: `.env.local`, override: true });
const app = (0, express_1.default)();
app.use(express_1.default.json());
console.log(process.env.JWT_ACCESS_TOKEN_SECRET);
// define routes
app.post('/user', user_1.default.validate, user_1.default.create);
app.put('/user', auth_1.default.authenticate, user_1.default.validate, user_1.default.update);
app.delete('/user', auth_1.default.authenticate, user_1.default.destroy);
app.get('/user', auth_1.default.authenticate, user_1.default.read);
// 404 handler
app.use((request, response) => {
    response.status(404).send("Not found!");
});
// 500 handler
app.use((error, request, response) => {
    console.error(error.stack);
    response.status(500).send('Something went wrong!');
});
// starting the server
app.listen(process.env.PORT, () => console.log(`Vending machine listening on port ${process.env.PORT}`));
