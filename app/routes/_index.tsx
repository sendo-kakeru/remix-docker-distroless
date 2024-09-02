import { PrismaClient } from "@prisma/client";
import {
  json,
  type ActionFunctionArgs,
  type MetaFunction,
} from "@remix-run/node";
import { redirect, useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};
const prisma = new PrismaClient();
export async function loader() {
  const todos = await prisma.todo.findMany();
  return json({ todos });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const createdTodo = await prisma.todo.create({
    data: { title: formData.get("title") as string },
  });
  console.log("createdTodo", createdTodo);
  return redirect(".");
}

export default function Index() {
  const loaderData = useLoaderData<typeof loader>();
  return (
    <div className="font-sans p-4">
      <form method="POST" action="/?index">
        <input type="text" name="title" />
        <button type="submit">submit</button>
      </form>
      <div>
        <p>Todo</p>
        <ul>
          {loaderData.todos.map((todo) => (
            <li key={todo.id}>{todo.title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
