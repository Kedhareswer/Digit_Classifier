import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BarChart, Database, Cpu } from "lucide-react"

export default function ModelInfo() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24">
      <div className="max-w-4xl w-full">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="flex items-center gap-2 pl-0">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Recognition</span>
            </Button>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-6">MNIST Digit Recognition Model</h1>
        <p className="text-lg mb-8">
          This application uses a convolutional neural network (CNN) trained on the MNIST dataset to recognize
          handwritten digits.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">98.7%</div>
              <p className="text-xs text-muted-foreground">On test dataset</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Training Data</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">60,000</div>
              <p className="text-xs text-muted-foreground">Training examples</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Model Size</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">~200 KB</div>
              <p className="text-xs text-muted-foreground">Optimized for web</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Architecture</CardTitle>
              <CardDescription>Convolutional Neural Network (CNN) structure</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Input Layer</h3>
                  <p>28x28 grayscale image (784 pixels)</p>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Convolutional Layers</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Conv2D: 32 filters, 3x3 kernel, ReLU activation</li>
                    <li>MaxPooling: 2x2</li>
                    <li>Conv2D: 64 filters, 3x3 kernel, ReLU activation</li>
                    <li>MaxPooling: 2x2</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Fully Connected Layers</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Dense: 128 neurons, ReLU activation</li>
                    <li>Dropout: 0.2 (for regularization)</li>
                    <li>Dense: 10 neurons (output), Softmax activation</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>MNIST Dataset</CardTitle>
              <CardDescription>Training and evaluation data</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4">
                The MNIST database (Modified National Institute of Standards and Technology database) is a large
                database of handwritten digits that is commonly used for training various image processing systems.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Training Set</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>60,000 examples</li>
                    <li>Balanced class distribution</li>
                    <li>28x28 pixel grayscale images</li>
                    <li>Normalized and centered</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Test Set</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>10,000 examples</li>
                    <li>Separate from training data</li>
                    <li>Used for performance evaluation</li>
                    <li>98.7% accuracy achieved</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
              <CardDescription>Model evaluation results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Accuracy by Digit</h3>
                  <ul className="space-y-1">
                    <li>
                      <span className="font-medium">0:</span> 99.2%
                    </li>
                    <li>
                      <span className="font-medium">1:</span> 99.5%
                    </li>
                    <li>
                      <span className="font-medium">2:</span> 98.3%
                    </li>
                    <li>
                      <span className="font-medium">3:</span> 98.1%
                    </li>
                    <li>
                      <span className="font-medium">4:</span> 98.4%
                    </li>
                    <li>
                      <span className="font-medium">5:</span> 97.9%
                    </li>
                    <li>
                      <span className="font-medium">6:</span> 98.8%
                    </li>
                    <li>
                      <span className="font-medium">7:</span> 98.6%
                    </li>
                    <li>
                      <span className="font-medium">8:</span> 97.8%
                    </li>
                    <li>
                      <span className="font-medium">9:</span> 98.2%
                    </li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">Common Confusions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>4 and 9 (similar upper curves)</li>
                    <li>3 and 8 (similar shapes)</li>
                    <li>5 and 6 (similar curves)</li>
                    <li>7 and 1 (similar straight lines)</li>
                    <li>2 and 7 (can appear similar when drawn quickly)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
