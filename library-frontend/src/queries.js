import { gql } from '@apollo/client'

export const CREATE_BOOK = gql`
	mutation createBook($title: String!, $author: String!, $published: Int!, $genres: [String!]!) {
		addBook(title: $title, author: $author, published: $published, genres: $genres) {
			title
			author
			published
			genres
		}
	}
`

export const BOOK_ADDED = gql`
	subscription {
		bookAdded {
			title
			author
			published
			genres
		}
	}
`

export const ALL_BOOKS = (genre) => {
	if (genre) {
		return gql`
		query {
			allBooks(genre: "${genre}") {
				title
				published
				author
				id
				genres
			}
		}
	`
	} else {
		return gql`
			query {
				allBooks {
					title
					published
					author
					id
					genres
				}
			}
		`
	}
}

export const ALL_AUTHORS = gql`
	query {
		allAuthors {
			name
			born
			id
			bookCount
		}
	}
`

export const UPDATE_AUTHOR = gql`
	mutation updateAuthor($name: String!, $setBornTo: Int!) {
		editAuthor(name: $name, setBornTo: $setBornTo) {
			name
			id
			born
			bookCount
		}
	}
`

export const LOGIN = gql`
	mutation login($username: String!, $password: String!) {
		login(username: $username, password: $password) {
			value
		}
	}
`

export const ME = gql`
	query {
		me {
			username
			favoriteGenre
			id
		}
	}
`
