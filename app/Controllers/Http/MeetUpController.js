'use strict'

const Database = use('Database')
const MeetUp = use('App/Models/MeetUp')

class MeetUpController {
  // Mostra todos os meetUps
  async index () {
    const meetups = MeetUp.query()
      .with('user')
      .fetch()

    return meetups
  }

  // Mostra todos os meetUps no qual o usuário não está inscrito
  async indexNotSubscript ({ auth }) {
    const userId = auth.user.id

    // Aqui capturamos o id de todas as inscrições do usuário Logado
    const meetUpsOfUserId = Database.from('user_subscriptions')
      .where('user_subscriptions.user_id', userId)
      .select('meetup_id')
      .groupBy('user_subscriptions.meetup_id')

    const meetups = MeetUp.query()
      .whereNotIn('meet_ups.id', meetUpsOfUserId) // Selecionamos todos os meetups com inscritos mas que o usuário logado não esteja
      .groupBy('meet_ups.id') // Agrupamos pelo ID
      .fetch()

    return meetups
  }

  // Mostra todos os meetUps que o usuário está inscrito
  async indexSubscript ({ auth }) {
    const userId = auth.user.id

    // Aqui capturamos o id de todas as inscrições do usuário Logado
    const meetUpsOfUserId = Database.from('user_subscriptions')
      .where('user_subscriptions.user_id', userId)
      .select('meetup_id')
      .groupBy('user_subscriptions.meetup_id')

    const meetups = MeetUp.query()
      .whereIn('meet_ups.id', meetUpsOfUserId)
      .groupBy('meet_ups.id')
      .fetch()

    return meetups
  }

  // Mostra todos os meetUps recomendados para o usuário de acordo com suas preferências
  async indexRecommended ({ auth }) {
    const userId = auth.user.id

    // Aqui capturamos o id de todas as inscrições do usuário Logado
    const meetUpsOfUserId = Database.from('user_subscriptions')
      .where('user_subscriptions.user_id', userId)
      .select('meetup_id')

    const prefsOfUserId = Database.from('user_preferences')
      .where('user_preferences.user_id', userId)
      .select('pref_id')

    const meetups = MeetUp.query()
      .whereNotIn('meet_ups.id', meetUpsOfUserId) // Selecionamos todos os meetups com inscritos mas que o usuário logado não esteja
      .whereIn('meet_ups.id_category', prefsOfUserId) // Selecionamos todos os meetups de acordo com as preferências do usuário
      .groupBy('meet_ups.id') // Agrupamos pelo ID
      .fetch()

    return meetups
  }

  // Cria um novo meetUp
  async store ({ request, response, auth }) {
    const user_id = auth.user.id

    const data = request.only([
      'id_category',
      'file_id',
      'date_event',
      'location',
      'title',
      'description'
    ])

    data.user_id = user_id
    const meetUp = await MeetUp.create(data)

    return meetUp
  }

  // Mostra um meetUp específico filtrando pelo id
  async show ({ params }) {
    // Aqui capturamos quantos inscritos tem nessa meet_up
    const qtdMeetUps = await Database.from('user_subscriptions')
      .where('user_subscriptions.meetup_id', params.id)
      .count('id as qtd')

    var meetUp = await MeetUp.query()
      .where('id', params.id)
      .with('file')
      .fetch()

    meetUp = [{ ...meetUp, qtd_subscriptions: qtdMeetUps[0].qtd }]

    return meetUp
  }

  // Mostra os meetUps filtrando pelo titulo
  async showByTitle ({ params }) {
    // console.log('Teste' + decodeURIComponent(params.title))

    var meetUp = await MeetUp.query()
      .where('title', decodeURIComponent(params.title))
      .with('file')
      .fetch()

    return meetUp
  }

  // Mostra os meetUps que o usuário está inscrito filtrando pelo titulo
  async showSubscriptByTitle ({ params, auth }) {
    const userId = auth.user.id

    var meetUp = await MeetUp.query()
      .innerJoin(
        'user_subscriptions',
        'user_subscriptions.meetup_id',
        'meet_ups.id'
      )
      .where('title', decodeURIComponent(params.title))
      .where('user_subscriptions.user_id', userId)
      .with('file')
      .fetch()

    return meetUp
  }

  // Mostra os meetUps recomendados mas que o usuário ainda não está inscrito de acordo com o título
  async showRecommendedByTitle ({ params, auth }) {
    const userId = auth.user.id

    // Aqui capturamos quais são as preferencias do usuário
    const prefsOfUserId = Database.from('user_preferences')
      .where('user_preferences.user_id', userId)
      .select('pref_id')

    // Aqui capturamos quais são os meetups que o usuário já está incluso
    const meetupsOfUserId = Database.from('user_subscriptions')
      .where('user_subscriptions.user_id', userId)
      .select('meetup_id')

    var meetUp = await MeetUp.query()
      .whereIn('id_category', prefsOfUserId)
      .whereNotIn('id', meetupsOfUserId)
      .where('title', decodeURIComponent(params.title))
      .with('file')
      .fetch()

    return meetUp
  }

  // Mostra um meetUp específico filtrando pelo título
  async showPerTitle ({ params, request, response, view }) {}

  // Altera um meetUp
  async update ({ params, request, response }) {}

  // Deleta um meetUp
  async destroy ({ params, request, response }) {}
}

module.exports = MeetUpController
