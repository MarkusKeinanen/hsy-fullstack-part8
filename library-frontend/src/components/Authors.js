import React, { useState } from 'react'
import { useQuery, useMutation } from '@apollo/client'
import { ALL_AUTHORS, UPDATE_AUTHOR } from '../queries'

const Authors = ({ setError }) => {
	const result = useQuery(ALL_AUTHORS)

	const [name, setName] = useState('')
	const [born, setBorn] = useState('')

	const [updateAuthor] = useMutation(UPDATE_AUTHOR, {
		refetchQueries: [{ query: ALL_AUTHORS }],
		onError: (error) => {
			setError(error.toString())
		}
	})
	const submit = async (event) => {
		event.preventDefault()
		setName('')
		setBorn('')
		updateAuthor({ variables: { name, setBornTo: parseInt(born) } })
	}

	if (result.loading) {
		return <div>loading...</div>
	}
	if (!result.data.allAuthors || result.data.allAuthors.length == 0) {
		return <div>No results</div>
	}

	return (
		<div>
			<h2>authors</h2>
			<table>
				<tbody>
					<tr>
						<th>Name</th>
						<th>born</th>
						<th>books</th>
					</tr>
					{result.data.allAuthors.map((a) => (
						<tr key={a.name}>
							<td>{a.name}</td>
							<td>{a.born}</td>
							<td>{a.bookCount}</td>
						</tr>
					))}
				</tbody>
			</table>

			<h2>set birthyear</h2>
			<form onSubmit={submit}>
				<div>
					name
					<select value={name} onChange={({ target }) => setName(target.value)}>
						{result.data.allAuthors.map((author, i) => {
							return (
								<option key={'option' + author.name + i} value={author.name}>
									{author.name}
								</option>
							)
						})}
					</select>
				</div>
				<div>
					born <input type='number' value={born} onChange={({ target }) => setBorn(target.value)} />
				</div>
				<button type='submit'>update author</button>
			</form>
		</div>
	)
}

export default Authors
