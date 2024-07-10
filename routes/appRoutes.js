const authRouter = require('./authRoutes')

const mountRoutes = (app) => {
    app.use('/mazad/api/auth', authRouter)
}
module.exports = mountRoutes; 