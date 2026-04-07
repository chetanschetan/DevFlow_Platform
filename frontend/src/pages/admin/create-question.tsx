// import * as React from 'react';
// import { useEffect } from 'react';
// import { useParams, useLocation } from 'wouter';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useForm, useFieldArray } from 'react-hook-form'; // Added useFieldArray
// import { zodResolver } from '@hookform/resolvers/zod';
// import { z } from 'zod';
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Input } from '@/components/ui/input';
// import { Textarea } from '@/components/ui/textarea';
// import { Label } from '@/components/ui/label';
// import { Switch } from '@/components/ui/switch';
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from '@/components/ui/select';
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage,
// } from '@/components/ui/form';
// import { RichTextEditor } from '@/components/ui/rich-text-editor';
// import { api } from '@/lib/api';
// import { useToast } from '@/hooks/use-toast';
// import {
//   ArrowLeft,
//   Plus,
//   Trash2,
//   Save,
//   Eye,
//   Loader2,
// } from 'lucide-react';

// const questionSchema = z.object({
//   questionId: z.string().min(1, 'Question ID is required'),
//   title: z.string().min(1, 'Title is required').max(200),
//   description: z.string().min(1, 'Description is required'),
//   marks: z.number().int().positive(),
//   topic: z.string().min(1, 'Topic is required'),
//   taxonomyLevel: z.enum(['Remember', 'Understand', 'Apply', 'Analyze']),
//   questionType: z.enum(['coding', 'mcq', 'guess_output']),
//   isVisible: z.boolean().default(true),
//   testCases: z.array(z.object({
//     input: z.string(),
//     expectedOutput: z.string(),
//     marks: z.number().int().positive(),
//   })).optional(),
//   hideTestCases: z.boolean().default(false),
//   options: z.array(z.object({
//     id: z.string(),
//     text: z.string(),
//     isCorrect: z.boolean(),
//   })).optional(),
//   codeSnippet: z.string().optional(),
//   expectedOutput: z.string().optional(),
// });

// type QuestionFormData = z.infer<typeof questionSchema>;

// export default function CreateQuestion() {
//   const { id } = useParams<{ id?: string }>();
//   const [, setLocation] = useLocation();
//   const { toast } = useToast();
//   const queryClient = useQueryClient();
//   const isEdit = !!id;

//   const form = useForm<QuestionFormData>({
//     resolver: zodResolver(questionSchema),
//     defaultValues: {
//       questionId: '',
//       title: '',
//       description: '',
//       marks: 10,
//       topic: '',
//       taxonomyLevel: 'Apply',
//       questionType: 'coding',
//       isVisible: true,
//       testCases: [{ input: '', expectedOutput: '', marks: 5 }],
//       options: [
//         { id: '1', text: '', isCorrect: false },
//         { id: '2', text: '', isCorrect: false },
//         { id: '3', text: '', isCorrect: false },
//         { id: '4', text: '', isCorrect: false },
//       ],
//       codeSnippet: '',
//       expectedOutput: '',
//     },
//   });

//   // FIX 1: Use Field Arrays instead of local state for list inputs
//   const { fields: testCaseFields, append: appendTestCase, remove: removeTestCase } = useFieldArray({
//     control: form.control,
//     name: "testCases"
//   });

//   const { fields: optionFields } = useFieldArray({
//     control: form.control,
//     name: "options"
//   });

//   const { data: existingQuestion, isLoading } = useQuery({
//     queryKey: ['/api/admin/question', id],
//     queryFn: () => api.admin.getQuestion(id!).then(res => res.json()),
//     enabled: isEdit,
//   });

//   // ID Generation Logic
//   useEffect(() => {
//     if (!isEdit && !form.getValues('questionId')) {
//       const generated = `Q-${Date.now().toString(36).toUpperCase()}`;
//       form.setValue('questionId', generated);
//     }
//   }, [isEdit, form]);

//   // Sync Edit Data
//   useEffect(() => {
//     if (existingQuestion) {
//       form.reset(existingQuestion);
//     }
//   }, [existingQuestion, form]);

//   const questionType = form.watch('questionType');

//   const createQuestionMutation = useMutation({
//     mutationFn: async (data: QuestionFormData) => {
//       const response = isEdit 
//         ? await api.admin.updateQuestion(id!, data)
//         : await api.admin.createQuestion(data);
//       if (!response.ok) throw new Error("Failed to save question");
//       return response.json();
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
//       toast({ title: "Success", description: "Question saved successfully" });
//       setLocation('/admin/questions');
//     },
//     onError: (error: any) => {
//       toast({ title: "Error", description: error.message, variant: "destructive" });
//     },
//   });

//   const onSubmit = (data: QuestionFormData) => {
//     // FIX 2: Dynamic data cleanup based on type before sending to API
//     const finalData = { ...data };
//     if (data.questionType !== 'coding') delete finalData.testCases;
//     if (data.questionType !== 'mcq') delete finalData.options;
    
//     createQuestionMutation.mutate(finalData);
//   };

//   if (isEdit && isLoading) return <div className="p-6"><Loader2 className="animate-spin" /></div>;

//   return (
//     <div className="p-6">
//       <div className="flex justify-between items-center mb-6">
//         <h1 className="text-3xl font-bold">{isEdit ? 'Edit' : 'Create'} Question</h1>
//         <Button variant="outline" onClick={() => setLocation('/admin/questions')}>
//           <ArrowLeft className="h-4 w-4 mr-2" /> Back
//         </Button>
//       </div>

//       <Form {...form}>
//         <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
//           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//             <div className="lg:col-span-2 space-y-6">
//               <Card>
//                 <CardHeader><CardTitle>Details</CardTitle></CardHeader>
//                 <CardContent className="space-y-4">
//                   <FormField control={form.control} name="title" render={({ field }) => (
//                     <FormItem><FormLabel>Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
//                   )} />
//                   <FormField control={form.control} name="description" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Description</FormLabel>
//                       <FormControl><RichTextEditor value={field.value} onChange={field.onChange} /></FormControl>
//                       <FormMessage />
//                     </FormItem>
//                   )} />
//                   <div className="grid grid-cols-2 gap-4">
//                     <FormField control={form.control} name="marks" render={({ field }) => (
//                       <FormItem><FormLabel>Marks</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl></FormItem>
//                     )} />
//                     <FormField control={form.control} name="topic" render={({ field }) => (
//                       <FormItem><FormLabel>Topic</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>
//                     )} />
//                   </div>
//                 </CardContent>
//               </Card>

//               {/* Conditional Sections */}
//               {questionType === 'coding' && (
//                 <Card>
//                   <CardHeader><CardTitle>Test Cases</CardTitle></CardHeader>
//                   <CardContent className="space-y-4">
//                     {testCaseFields.map((item, index) => (
//                       <div key={item.id} className="border p-4 rounded-md space-y-3">
//                         <div className="flex justify-between items-center">
//                           <span className="font-bold">Case #{index + 1}</span>
//                           <Button variant="ghost" size="sm" onClick={() => removeTestCase(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
//                         </div>
//                         <div className="grid grid-cols-2 gap-4">
//                           <FormField control={form.control} name={`testCases.${index}.input`} render={({ field }) => (
//                             <FormItem><FormLabel>Input</FormLabel><Textarea {...field} /></FormItem>
//                           )} />
//                           <FormField control={form.control} name={`testCases.${index}.expectedOutput`} render={({ field }) => (
//                             <FormItem><FormLabel>Output</FormLabel><Textarea {...field} /></FormItem>
//                           )} />
//                         </div>
//                       </div>
//                     ))}
//                     <Button type="button" variant="outline" onClick={() => appendTestCase({ input: '', expectedOutput: '', marks: 5 })}>
//                       <Plus className="h-4 w-4 mr-2" /> Add Case
//                     </Button>
//                   </CardContent>
//                 </Card>
//               )}

//               {questionType === 'mcq' && (
//                 <Card>
//                   <CardHeader><CardTitle>Options</CardTitle></CardHeader>
//                   <CardContent className="space-y-4">
//                     {optionFields.map((item, index) => (
//                       <div key={item.id} className="flex items-center gap-4">
//                         <FormField control={form.control} name={`options.${index}.isCorrect`} render={({ field }) => (
//                           <input type="radio" checked={field.value} onChange={() => {
//                             optionFields.forEach((_, i) => form.setValue(`options.${i}.isCorrect`, i === index));
//                           }} />
//                         )} />
//                         <FormField control={form.control} name={`options.${index}.text`} render={({ field }) => (
//                           <Input {...field} placeholder={`Option ${index + 1}`} />
//                         )} />
//                       </div>
//                     ))}
//                   </CardContent>
//                 </Card>
//               )}
//             </div>

//             <div className="space-y-6">
//               <Card>
//                 <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
//                 <CardContent className="space-y-4">
//                   <FormField control={form.control} name="questionType" render={({ field }) => (
//                     <FormItem>
//                       <FormLabel>Type</FormLabel>
//                       <Select onValueChange={field.onChange} value={field.value}>
//                         <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
//                         <SelectContent>
//                           <SelectItem value="coding">Coding</SelectItem>
//                           <SelectItem value="mcq">MCQ</SelectItem>
//                           <SelectItem value="guess_output">Guess Output</SelectItem>
//                         </SelectContent>
//                       </Select>
//                     </FormItem>
//                   )} />
//                   <FormField control={form.control} name="isVisible" render={({ field }) => (
//                     <FormItem className="flex items-center justify-between border p-3 rounded-md">
//                       <FormLabel>Active</FormLabel>
//                       <Switch checked={field.value} onCheckedChange={field.onChange} />
//                     </FormItem>
//                   )} />
//                 </CardContent>
//               </Card>
              
//               <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={createQuestionMutation.isPending}>
//                 {createQuestionMutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2" />}
//                 {isEdit ? 'Update' : 'Save'} Question
//               </Button>
//             </div>
//           </div>
//         </form>
//       </Form>
//     </div>
//   );
// }

import * as React from 'react';
import { useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  Loader2,
} from 'lucide-react';

const questionSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required'),
  marks: z.number().int().positive(),
  topic: z.string().min(1, 'Topic is required'),
  taxonomyLevel: z.enum(['Remember', 'Understand', 'Apply', 'Analyze']),
  questionType: z.enum(['coding', 'mcq', 'guess_output']),
  isVisible: z.boolean().default(true),
  testCases: z.array(z.object({
    input: z.string(),
    expectedOutput: z.string(),
    marks: z.number().int().positive().default(5),
  })).optional(),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).optional(),
  codeSnippet: z.string().optional(),
  expectedOutput: z.string().optional(),
});

type QuestionFormData = z.infer<typeof questionSchema>;

export default function CreateQuestion() {
  const { id } = useParams<{ id?: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      questionId: '',
      title: '',
      description: '',
      marks: 10,
      topic: '',
      taxonomyLevel: 'Apply',
      questionType: 'coding',
      isVisible: true,
      testCases: [{ input: '', expectedOutput: '', marks: 5 }],
      options: [
        { id: '1', text: '', isCorrect: false },
        { id: '2', text: '', isCorrect: false },
        { id: '3', text: '', isCorrect: false },
        { id: '4', text: '', isCorrect: false },
      ],
      codeSnippet: '',
      expectedOutput: '',
    },
  });

  const { fields: testCaseFields, append: appendTestCase, remove: removeTestCase } = useFieldArray({
    control: form.control,
    name: "testCases"
  });

  const { fields: optionFields } = useFieldArray({
    control: form.control,
    name: "options"
  });

  const { data: existingQuestion, isLoading } = useQuery({
    queryKey: ['/api/admin/question', id],
    queryFn: async () => {
      const res = await api.admin.getQuestion(id!);
      return res.json();
    },
    enabled: isEdit,
  });

  // Generate ID for new questions
  useEffect(() => {
    if (!isEdit && !form.getValues('questionId')) {
      form.setValue('questionId', `Q-${Date.now().toString(36).toUpperCase()}`);
    }
  }, [isEdit, form]);

  // Load data for editing
  useEffect(() => {
    if (existingQuestion) {
      form.reset(existingQuestion);
    }
  }, [existingQuestion, form]);

  const questionType = form.watch('questionType');

  const mutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const response = isEdit 
        ? await api.admin.updateQuestion(id!, data)
        : await api.admin.createQuestion(data);
      if (!response.ok) throw new Error("Failed to save question");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/questions'] });
      toast({ title: "Success", description: "Question saved successfully" });
      setLocation('/admin/questions');
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: QuestionFormData) => {
    const finalData = { ...data };
    // Force numbers to be numbers (HTML inputs return strings)
    finalData.marks = Number(finalData.marks);
    
    // Clean up payloads based on type
    if (finalData.questionType !== 'coding') delete finalData.testCases;
    if (finalData.questionType !== 'mcq') delete finalData.options;
    
    mutation.mutate(finalData);
  };

  if (isEdit && isLoading) return <div className="p-6 flex justify-center"><Loader2 className="animate-spin h-10 w-10" /></div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{isEdit ? 'Edit' : 'Create'} Question</h1>
        <Button variant="outline" onClick={() => setLocation('/admin/questions')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to List
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader><CardTitle>Core Details</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Question Title</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="description" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Problem Description</FormLabel>
                      <FormControl><RichTextEditor value={field.value} onChange={field.onChange} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="marks" render={({ field }) => (
                      <FormItem><FormLabel>Total Marks</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="topic" render={({ field }) => (
                      <FormItem><FormLabel>Topic / Tags</FormLabel><FormControl><Input placeholder="e.g. Arrays, Recursion" {...field} /></FormControl></FormItem>
                    )} />
                  </div>
                </CardContent>
              </Card>

              {questionType === 'coding' && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Test Cases</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={() => appendTestCase({ input: '', expectedOutput: '', marks: 5 })}>
                      <Plus className="h-4 w-4 mr-1" /> Add
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {testCaseFields.map((item, index) => (
                      <div key={item.id} className="border p-4 rounded-md bg-muted/30">
                        <div className="flex justify-between mb-3">
                          <span className="text-sm font-semibold">Test Case {index + 1}</span>
                          <Button variant="ghost" size="sm" onClick={() => removeTestCase(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField control={form.control} name={`testCases.${index}.input`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Input Data</FormLabel><Textarea {...field} className="font-mono text-xs" /></FormItem>
                          )} />
                          <FormField control={form.control} name={`testCases.${index}.expectedOutput`} render={({ field }) => (
                            <FormItem><FormLabel className="text-xs">Expected Output</FormLabel><Textarea {...field} className="font-mono text-xs" /></FormItem>
                          )} />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {questionType === 'mcq' && (
                <Card>
                  <CardHeader><CardTitle>Multiple Choice Options</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    {optionFields.map((item, index) => (
                      <div key={item.id} className="flex items-center gap-4 p-2 border rounded-md">
                        <FormField control={form.control} name={`options.${index}.isCorrect`} render={({ field }) => (
                          <input 
                            type="radio" 
                            name="correct-option"
                            checked={field.value} 
                            onChange={() => {
                              optionFields.forEach((_, i) => form.setValue(`options.${i}.isCorrect`, i === index));
                            }} 
                            className="h-4 w-4 accent-primary"
                          />
                        )} />
                        <FormField control={form.control} name={`options.${index}.text`} render={({ field }) => (
                          <Input {...field} placeholder={`Option ${index + 1}`} className="border-none focus-visible:ring-0" />
                        )} />
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <FormField control={form.control} name="questionId" render={({ field }) => (
                    <FormItem><FormLabel>Unique ID</FormLabel><FormControl><Input {...field} disabled={isEdit} /></FormControl></FormItem>
                  )} />
                  <FormField control={form.control} name="questionType" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mode</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={isEdit}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="coding">Coding Problem</SelectItem>
                          <SelectItem value="mcq">MCQ</SelectItem>
                          <SelectItem value="guess_output">Output Prediction</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="isVisible" render={({ field }) => (
                    <FormItem className="flex items-center justify-between border p-3 rounded-md">
                      <FormLabel className="m-0">Public Visibility</FormLabel>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormItem>
                  )} />
                </CardContent>
              </Card>
              
              <Button type="submit" className="w-full h-12 text-lg" disabled={mutation.isPending}>
                {mutation.isPending ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />}
                {isEdit ? 'Update Question' : 'Publish Question'}
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}