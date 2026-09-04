"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface SearchResult {
  title: string;
  price: string;
  location: string;
  imageUrl: string | undefined;
  link: string;
}

export default function ToriSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/tori-search?q=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setResults(data.results);
    } catch (error) {
      console.error("Hakuvirhe:", error);
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Torittaja</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              type="text"
              placeholder="Etsi jotain..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Haetaan...
                </>
              ) : (
                "Hae"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <Card key={index} className="overflow-hidden">
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="no-underline"
            >
              {result.imageUrl && (
                <div className="relative aspect-video w-full overflow-hidden">
                  <Image
                    src={result.imageUrl}
                    alt={result.title}
                    width={480}
                    height={320}
                    className="object-cover w-full h-full"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <h3 className="font-semibold mb-2 text-lg">{result.title}</h3>
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-green-600">
                    {result.price}
                  </span>
                  <span className="text-sm text-gray-500">
                    {result.location}
                  </span>
                </div>
              </CardContent>
            </a>
          </Card>
        ))}
      </div>
    </div>
  );
}
