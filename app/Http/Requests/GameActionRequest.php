<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GameActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'in:roll,buy,end_turn,leave'],
            'space_id' => ['nullable', 'integer', 'between:0,39'],
        ];
    }
}
