"use client";
import { trpc } from "@/app/_trpc/client";
import { serverClient } from "@/app/_trpc/serverClient";
import { useState } from "react";

export default function TodoList({
	initialTodos,
}: {
	initialTodos: Awaited<ReturnType<(typeof serverClient)["getTodos"]>>;
}) {
	const getTodos = trpc.getTodos.useQuery(undefined, {
		initialData: initialTodos,
		refetchOnMount: false,
		refetchOnReconnect: false
	});

	const addTodo = trpc.addTodo.useMutation({
		onSettled: () => {
			getTodos.refetch();
		},
	});

	const setDone = trpc.setDone.useMutation({
		onSettled: () => {
			getTodos.refetch();
		},
	});

	const [content, setContent] = useState("");

	return (
		<div>
			<div className="text-black my-5 text-3xl">
				{getTodos?.data?.map((todo) => (
					<div key={todo.id} className="flex gap-3 items-center">
						<input
							id={`check-${todo.id}`}
							type="checkbox"
							checked={!!todo.done}
							style={{ zoom: 1.5 }}
							onChange={async () => {
								setDone.mutate({
									id: todo.id,
									done: todo.done ? 0 : 1,
								});
							}}
						/>
						<label htmlFor={`check-${todo.id}`}>{todo.content}</label>
					</div>
				))}
			</div>
			<div className="flex justify-between">
				<label htmlFor="content">Content:</label>
				<input
					id="content"
					value={content}
					onChange={(e) => setContent(e.target.value)}
					className="text-black border border-black"
				/>
				<button
					className="bg-black text-white p-2 rounded-lg"
					onClick={async () => {
						if (content.length) {
							addTodo.mutate(content);
							setContent("");
						}
					}}
				>
					Add Todo
				</button>
			</div>
		</div>
	);
}
