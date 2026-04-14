"use client";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useRouter } from "next/navigation";

const Home = () => {
  const [file, setFile] = useState<File | null>(null);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_BASE_URL}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      if (response.data.success) {
        router.push("/chat");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="w-full flex flex-col gap-8 items-center justify-center h-screen">
      <div className="max-w-md">
        <Field>
          <FieldLabel htmlFor="pdf">PDF</FieldLabel>
          <Input
            onChange={(e) => setFile(e.target?.files?.[0] || null)}
            id="pdf"
            type="file"
          />
          <FieldDescription>Select a Pdf to upload.</FieldDescription>
        </Field>
      </div>

      <Button size="lg" onClick={handleSubmit}>
        Submit
      </Button>
    </div>
  );
};

export default Home;
