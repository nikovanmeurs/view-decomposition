const amqp = require('amqplib')

async function app() {
  const connection = await amqp.connect('amqp://localhost')
  const channel = await connection.createChannel()

  await channel.assertExchange('widget-request', 'topic')
  await channel.assertExchange('widget', 'topic')
  await channel.assertQueue('crm-widget-request')
  await channel.bindQueue('crm-widget-request', 'widget-request', '#')

  channel.consume('crm-widget-request', async (message) => {
    const request = JSON.parse(message.content.toString('utf-8'))
    if (request.widget !== 'CRM.ProductName') {
      return
    }

    const productCatalog = {
      111234: 'Fancy pants',
      111235: 'Keychain',
    }

    const productName = productCatalog[request.productId]
    if (!productName) {
      await channel.publish('widget', '', Buffer.from(JSON.stringify({
        ...request,
        html: '<h1>Unknown product</h1>'
      })))
    }

    await channel.publish('widget', '', Buffer.from(JSON.stringify({
      ...request,
      html: `<h1>${productName}</h1>`
    })))
  }, { noAck: true })
}

app()
