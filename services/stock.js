const amqp = require('amqplib')

async function app() {
  const connection = await amqp.connect('amqp://localhost')
  const channel = await connection.createChannel()

  await channel.assertExchange('widget-request', 'topic')
  await channel.assertExchange('widget', 'topic')
  await channel.assertQueue('stock-widget-request')
  await channel.bindQueue('stock-widget-request', 'widget-request', '#')

  channel.consume('stock-widget-request', async (message) => {
    const request = JSON.parse(message.content.toString('utf-8'))
    if (request.widget !== 'Stock.Amount') {
      return
    }

    await channel.publish('widget', '', Buffer.from(JSON.stringify({
      ...request,
      html: `<div>Infinite supply</div>`
    })))
  }, { noAck: true })
}

app()
