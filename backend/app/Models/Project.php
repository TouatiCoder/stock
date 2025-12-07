<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'company_id',
        'name',
        'location',
        'status',
        'budget',
        'spent',
        'start_date',
        'end_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected function casts(): array
    {
        return [
            'budget' => 'decimal:2',
            'spent' => 'decimal:2',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /**
     * Get the company that owns the project.
     */
    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    /**
     * Get the materials for the project.
     */
    public function materials()
    {
        return $this->belongsToMany(Material::class)->withPivot('quantity', 'unit_price');
    }
}
