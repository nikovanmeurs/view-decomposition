const amqp = require('amqplib')

async function app() {
  const connection = await amqp.connect('amqp://localhost')
  const channel = await connection.createChannel()

  await channel.assertExchange('widget-request', 'topic')
  await channel.assertExchange('widget', 'topic')
  await channel.assertQueue('sales-widget-request')
  await channel.bindQueue('sales-widget-request', 'widget-request', '#')

  channel.consume('sales-widget-request', async (message) => {
    const request = JSON.parse(message.content.toString('utf-8'))
    if (request.widget !== 'Sales.Price') {
      return
    }

    const priceCatalog = {
      111234: 350,
      111235: 1,
    }

    const productPrice = priceCatalog[request.productId]
    if (!productPrice) {
      await channel.publish('widget', '', Buffer.from(JSON.stringify({
        ...request,
        html: '<div>Unknown price</div>'
      })))
    }

    await channel.publish('widget', '', Buffer.from(JSON.stringify({
      ...request,
      html: `<div>${productPrice} dollars</div>`
    })))
  }, { noAck: true })
}

app()
