import React, { useState } from 'react'
import { useQuery } from '@apollo/client'
import { ALL_BOOKS } from '../queries'

const Books = ({ favoriteGenre }) => {
	const [genreFilter, setGenreFilter] = useState(null)

	//to not lose track of all books
	const allBooksResult = useQuery(ALL_BOOKS(null))

	//this is the real list
	const trueFilter = favoriteGenre ? favoriteGenre : genreFilter
	const result = useQuery(ALL_BOOKS(trueFilter))

	if (result.loading) {
		return <div>loading...</div>
	}
	if (!result.data.allBooks) {
		return <div>No results</div>
	}

	const genres = []
	allBooksResult.data.allBooks.forEach((book) => book.genres.forEach((genre) => (genres.includes(genre) ? null : genres.push(genre))))

	// const filtered = result.data.allBooks.filter((book) => {
	// 	if (favoriteGenre) return book.genres.includes(favoriteGenre)
	// 	return genreFilter ? book.genres.includes(genreFilter) : true
	// })

	return (
		<div>
			<h2>{favoriteGenre ? 'Recommendations' : 'Books'}</h2>
			{favoriteGenre && (
				<p>
					Books in your favorite genre: <strong>{favoriteGenre}</strong>
				</p>
			)}
			<table>
				<tbody>
					<tr>
						<th>title</th>
						<th>author</th>
						<th>published</th>
					</tr>
					{result.data.allBooks.map((a) => (
						<tr key={a.id}>
							<td>{a.title}</td>
							<td>{a.author}</td>
							<td>{a.published}</td>
						</tr>
					))}
				</tbody>
			</table>
			{!favoriteGenre && (
				<>
					<button onClick={() => setGenreFilter(null)}>Kaikki genret</button>
					{genres.map((genre) => (
						<button onClick={() => setGenreFilter(genre)} key={genre}>
							{genre}
						</button>
					))}
				</>
			)}
		</div>
	)
}

export default Books
