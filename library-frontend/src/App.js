import React, { useState, useEffect } from 'react'
import { useLazyQuery, useApolloClient, useSubscription } from '@apollo/client'
import Authors from './components/Authors'
import Books from './components/Books'
import NewBook from './components/NewBook'
import LoginForm from './components/LoginForm'
import { ME, ALL_BOOKS, BOOK_ADDED } from './queries'

const Notify = ({ errorMessage }) => {
	if (!errorMessage) {
		return null
	}
	return <div style={{ color: 'red' }}>{errorMessage}</div>
}

const App = () => {
	const [page, setPage] = useState('authors')
	const [errorMessage, setErrorMessage] = useState(null)
	const [token, setToken] = useState(null)
	const [favoriteGenre, setFavoriteGenre] = useState(null)
	const client = useApolloClient()

	const [runMeQuery, meResult] = useLazyQuery(ME)

	useEffect(() => {
		if (token && !meResult.data) {
			runMeQuery()
		} else if (token && meResult.data) {
			setFavoriteGenre(meResult.data.me.favoriteGenre)
		}
	}, [meResult.data, token])

	const notify = (message) => {
		setErrorMessage(message)
		setTimeout(() => {
			setErrorMessage(null)
		}, 10000)
	}

	const updateCacheWith = (addedBook) => {
		const includedIn = (set, object) => set.map((p) => p.id).includes(object.id)
		const dataInStore = client.readQuery({ query: ALL_BOOKS() })
		console.log(dataInStore)
		if (!includedIn(dataInStore.allBooks, addedBook)) {
			client.writeQuery({
				query: ALL_BOOKS(),
				data: { allBooks: dataInStore.allBooks.concat(addedBook) }
			})
		}
	}
	useSubscription(BOOK_ADDED, {
		onSubscriptionData: ({ subscriptionData }) => {
			const addedBook = subscriptionData.data.bookAdded
			notify(`${addedBook.title} added`)
			updateCacheWith(addedBook)
		}
	})

	const logout = () => {
		setToken(null)
		localStorage.clear()
		client.resetStore()
	}

	return (
		<div>
			<Notify errorMessage={errorMessage} />
			<div>
				<button onClick={() => setPage('authors')}>authors</button>
				<button onClick={() => setPage('books')}>books</button>
				{token && <button onClick={() => setPage('add')}>add book</button>}
				{token && <button onClick={() => setPage('recommend')}>recommend</button>}
				{token ? <button onClick={logout}>logout</button> : <button onClick={() => setPage('login')}>log in</button>}
			</div>
			{!token && page === 'login' && <LoginForm setToken={setToken} setError={notify} goToAuthors={() => setPage('authors')} />}
			{page === 'authors' && <Authors setError={notify} />}
			{page === 'books' && <Books />}
			{page === 'recommend' && <Books favoriteGenre={favoriteGenre} />}
			{page === 'add' && <NewBook setError={notify} goToBooks={() => setPage('books')} />}
		</div>
	)
}

export default App
