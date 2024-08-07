const amqp = require('amqplib')

async function app() {
  const connection = await amqp.connect('amqp://localhost')
  const channel = await connection.createChannel()

  await channel.assertExchange('widget-request', 'topic')
  await channel.assertExchange('widget', 'topic')
  await channel.assertQueue('page-widget-response')
  await channel.bindQueue('page-widget-response', 'widget', '#')

  const productId = 111234

  const getWidget = createGetWidget(channel)
  
  console.log(`
    <!html>
    <body>
      ${await getWidget('CRM.ProductName', productId)}
      ${await getWidget('Sales.Price', productId)}
      ${await getWidget('Stock.Amount', productId)}
    </body>
  `)
}


function createGetWidget(channel) {
  let responses = {}

  channel.consume('page-widget-response', async (message) => {
    const { widget, productId, html } = JSON.parse(message.content.toString('utf-8'))

    responses[`${widget}-${productId}`] = html
    await channel.ack(message)
  })

  return async function getWidget(widget, productId) {
    return new Promise(async (resolve) => {
      await channel.publish('widget-request', '', Buffer.from(JSON.stringify({
        productId,
        widget,
      })))

      setInterval(() => {
        if (responses[`${widget}-${productId}`]) {
          const html = responses[`${widget}-${productId}`]
          delete responses[`${widget}-${productId}`]
          resolve(html)
        }
      }, 1)
    })
  }
}



app()
