import app from './app'

// starting the server
app.listen(
    process.env.PORT, 
    () => console.log(`Vending machine listening on port ${process.env.PORT}`)
  )