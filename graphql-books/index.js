const { ApolloServer, UserInputError, AuthenticationError, gql } = require('apollo-server')
const { v1: uuid } = require('uuid')
const jwt = require('jsonwebtoken')

const { PubSub } = require('apollo-server')
const pubsub = new PubSub()

const mongoose = require('mongoose')
const Author = require('./models/author')
const User = require('./models/user')
const Book = require('./models/book')

const JWT_SECRET = '7XsArIvzumvpUMQs'
//-u hsy-part8-user
//-p IqFa4Not45ybO8IA
const MONGODB_URI = 'mongodb+srv://hsy-part8-user:IqFa4Not45ybO8IA@cluster0.9zxmp.mongodb.net/hsy-fullstack?retryWrites=true&w=majority'

console.log('connecting to', MONGODB_URI)

mongoose
	.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
	.then(() => {
		console.log('connected to MongoDB')
	})
	.catch((error) => {
		console.log('error connecting to MongoDB:', error.message)
	})

const typeDefs = gql`
	type Author {
		name: String!
		id: ID!
		born: Int
		bookCount: Int!
	}
	type Book {
		title: String!
		published: Int!
		author: String!
		genres: [String!]!
		id: ID!
	}
	type User {
		username: String!
		id: ID!
		favoriteGenre: String!
	}
	type Token {
		value: String!
	}
	type Query {
		bookCount: Int!
		authorCount: Int!
		allBooks(author: String, genre: String): [Book!]!
		allAuthors: [Author!]!
		me: User
	}
	type Mutation {
		addBook(title: String!, author: String, published: Int!, genres: [String!]!): Book
		editAuthor(name: String!, setBornTo: Int!): Author
		createUser(username: String!): User
		login(username: String!, password: String!): Token
	}
	type Subscription {
		bookAdded: Book!
	}
`

const resolvers = {
	Query: {
		bookCount: () => Book.collection.countDocuments(),
		authorCount: () => Author.collection.countDocuments(),
		allBooks: (root, args) => {
			let mongooseQuery = {}
			if (args.author) {
				mongooseQuery = {
					...mongooseQuery,
					author: args.author
				}
			}
			if (args.genre) {
				mongooseQuery = {
					...mongooseQuery,
					genres: args.genre
				}
			}
			return Book.find(mongooseQuery)
		},
		allAuthors: (root, args) => {
			return Author.find({})
		},
		me: (root, args, context) => {
			if (!context.currentUser) return null
			console.log(context.currentUser)
			return context.currentUser
		}
	},
	Author: {
		bookCount: async (root) => {
			return Book.find({ author: root.name }).countDocuments()
		}
	},
	Mutation: {
		addBook: async (root, args, context) => {
			const book = new Book({ ...args })
			const currentUser = context.currentUser
			if (!currentUser) {
				throw new AuthenticationError('not authenticated')
			}
			try {
				await book.save()
				const authorsWithName = await Author.find({ name: args.author }).countDocuments()
				if (authorsWithName == 0) {
					const author = new Author({ name: args.author, id: uuid(), born: null })
					await author.save()
				}
				pubsub.publish('BOOK_ADDED', { bookAdded: book })
			} catch (error) {
				throw new UserInputError(error.message, {
					invalidArgs: args
				})
			}
			return book
		},
		editAuthor: async (root, args) => {
			const author = await Author.findOne({ name: args.name })
			author.born = args.setBornTo
			try {
				await author.save()
			} catch (error) {
				throw new UserInputError(error.message, {
					invalidArgs: args
				})
			}
		},
		createUser: (root, args) => {
			const user = new User({ username: args.username, favoriteGenre: 'None' })

			return user.save().catch((error) => {
				throw new UserInputError(error.message, {
					invalidArgs: args
				})
			})
		},
		login: async (root, args) => {
			const user = await User.findOne({ username: args.username })

			if (!user || args.password !== 'test') {
				throw new UserInputError('wrong credentials')
			}

			const userForToken = {
				username: user.username,
				id: user._id
			}

			return { value: jwt.sign(userForToken, JWT_SECRET) }
		}
	},
	Subscription: {
		bookAdded: {
			subscribe: () => pubsub.asyncIterator(['BOOK_ADDED'])
		}
	}
}

const server = new ApolloServer({
	typeDefs,
	resolvers,
	context: async ({ req }) => {
		const auth = req ? req.headers.authorization : null
		if (auth && auth.toLowerCase().startsWith('bearer ')) {
			const decodedToken = jwt.verify(auth.substring(7), JWT_SECRET)
			const currentUser = await User.findById(decodedToken.id).populate('friends')
			return { currentUser }
		}
	}
})

server.listen().then(({ url, subscriptionsUrl }) => {
	console.log(`Server ready at ${url}`)
	console.log(`Subscriptions ready at ${subscriptionsUrl}`)
})
